import { useState, useEffect } from 'react';
import { Plus, Briefcase, MapPin, Building2, X, ChevronRight, Users, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const JOB_STATUS = [
  { key: 'offen',         label: 'Offen',          color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'in_bearbeitung',label: 'In Bearbeitung',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'besetzt',       label: 'Besetzt',         color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { key: 'pausiert',      label: 'Pausiert',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

const PRIORITY = [
  { key: 'hoch',   label: 'Hoch',   color: 'text-red-600' },
  { key: 'mittel', label: 'Mittel', color: 'text-amber-600' },
  { key: 'niedrig',label: 'Niedrig',color: 'text-gray-500' },
];

function StatusBadge({ status }) {
  const s = JOB_STATUS.find(x => x.key === status) || JOB_STATUS[0];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>;
}

function AddJobModal({ onClose, onSave, companies }) {
  const [form, setForm] = useState({
    title: '', company_id: '', description: '', location: '',
    salary_from: '', salary_to: '', status: 'offen', priority: 'mittel', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Titel ist erforderlich.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, company_id: form.company_id || null, salary_from: parseInt(form.salary_from) || null, salary_to: parseInt(form.salary_to) || null };
      const { data } = await api.post('/crm/jobs', payload);
      onSave(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Neue Stelle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="label">Stellentitel *</label>
            <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Senior Software Engineer" autoFocus />
          </div>
          <div>
            <label className="label">Unternehmen</label>
            <select className="input-field" value={form.company_id} onChange={e => set('company_id', e.target.value)}>
              <option value="">– Unternehmen wählen –</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Standort</label>
              <input className="input-field" value={form.location} onChange={e => set('location', e.target.value)} placeholder="München" />
            </div>
            <div>
              <label className="label">Priorität</label>
              <select className="input-field" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITY.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Gehalt von (€)</label>
              <input className="input-field" type="number" value={form.salary_from} onChange={e => set('salary_from', e.target.value)} placeholder="60000" />
            </div>
            <div>
              <label className="label">Gehalt bis (€)</label>
              <input className="input-field" type="number" value={form.salary_to} onChange={e => set('salary_to', e.target.value)} placeholder="90000" />
            </div>
          </div>
          <div>
            <label className="label">Stellenbeschreibung</label>
            <textarea className="input-field resize-none" rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
              {JOB_STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Abbrechen</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50">
            {saving ? 'Speichern…' : 'Stelle anlegen'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [jobsRes, companiesRes] = await Promise.all([
        api.get('/crm/jobs'),
        api.get('/crm/companies'),
      ]);
      setJobs(jobsRes.data);
      setCompanies(companiesRes.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaved = job => { setJobs(prev => [job, ...prev]); setShowAdd(false); };

  const handleDelete = async id => {
    if (!window.confirm('Stelle wirklich löschen?')) return;
    try {
      await api.delete(`/crm/jobs/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch {
      /* ignore */
    }
  };

  const filtered = filterStatus ? jobs.filter(j => j.status === filterStatus) : jobs;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!filterStatus ? 'bg-brand text-white border-brand' : 'border-gray-200 hover:border-brand/40 text-gray-600'}`}
          >
            Alle ({jobs.length})
          </button>
          {JOB_STATUS.slice(0, 3).map(s => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(filterStatus === s.key ? '' : s.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filterStatus === s.key ? 'bg-brand text-white border-brand' : 'border-gray-200 hover:border-brand/40 text-gray-600'}`}
            >
              {s.label} ({jobs.filter(j => j.status === s.key).length})
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors"
        >
          <Plus size={14} /> Stelle anlegen
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Keine Stellen vorhanden</p>
          <p className="text-sm text-gray-400 mt-1">Lege deine erste Vakanz an</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => {
            const priority = PRIORITY.find(p => p.key === job.priority) || PRIORITY[1];
            const salaryStr = job.salary_from && job.salary_to
              ? `${(job.salary_from / 1000).toFixed(0)}k – ${(job.salary_to / 1000).toFixed(0)}k €`
              : job.salary_from ? `ab ${(job.salary_from / 1000).toFixed(0)}k €` : null;

            return (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-brand/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
                    <Briefcase size={18} className="text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <StatusBadge status={job.status} />
                      <span className={`text-xs font-medium ${priority.color}`}>● {priority.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                      {job.company_name && (
                        <span className="flex items-center gap-1"><Building2 size={12} />{job.company_name}</span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                      )}
                      {salaryStr && <span>{salaryStr}</span>}
                      <span className="flex items-center gap-1"><Users size={12} />{job.candidate_count || 0} Kandidaten</span>
                    </div>
                    {job.description && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{job.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onSave={handleSaved} companies={companies} />}
    </div>
  );
}
