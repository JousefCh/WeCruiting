import { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Download, User, MapPin, Briefcase, Phone, Mail,
  MoreHorizontal, ChevronDown, X, Check, FileText, ArrowUpRight,
} from 'lucide-react';
import api from '../../services/api';

const STAGES = [
  { key: 'neu',         label: 'Neu',         color: 'bg-gray-400',    light: 'bg-gray-50',    border: 'border-gray-200', text: 'text-gray-600' },
  { key: 'kontaktiert', label: 'Kontaktiert',  color: 'bg-blue-500',    light: 'bg-blue-50',    border: 'border-blue-200', text: 'text-blue-700' },
  { key: 'vorgestellt', label: 'Vorgestellt',  color: 'bg-violet-500',  light: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700' },
  { key: 'interview',   label: 'Interview',    color: 'bg-amber-500',   light: 'bg-amber-50',   border: 'border-amber-200', text: 'text-amber-700' },
  { key: 'angebot',     label: 'Angebot',      color: 'bg-orange-500',  light: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700' },
  { key: 'platziert',   label: 'Platziert',    color: 'bg-green-500',   light: 'bg-green-50',   border: 'border-green-200', text: 'text-green-700' },
  { key: 'inaktiv',     label: 'Inaktiv',      color: 'bg-gray-300',    light: 'bg-gray-50',    border: 'border-gray-200', text: 'text-gray-400' },
];

const SOURCE_LABELS = {
  manuell: 'Manuell', lebenslauf: 'CV Import', linkedin: 'LinkedIn',
  empfehlung: 'Empfehlung', initiativ: 'Initiativ',
};

function StageBadge({ stage }) {
  const s = STAGES.find(x => x.key === stage) || STAGES[0];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.light} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
      {s.label}
    </span>
  );
}

// ── Add Candidate Modal ────────────────────────────────────────────────────────

function AddCandidateModal({ onClose, onSave, initialStage = 'neu' }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    current_position: '', current_company: '', location: '',
    desired_salary: '', notice_period: '', pipeline_stage: initialStage,
    source: 'manuell', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.first_name.trim()) { setError('Vorname ist erforderlich.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/crm/candidates', form);
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
          <h3 className="font-semibold text-gray-900">Neuer Kandidat</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vorname *</label>
              <input className="input-field" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Max" autoFocus />
            </div>
            <div>
              <label className="label">Nachname</label>
              <input className="input-field" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Mustermann" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">E-Mail</label>
              <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Aktuelle Position</label>
              <input className="input-field" value={form.current_position} onChange={e => set('current_position', e.target.value)} placeholder="Senior Developer" />
            </div>
            <div>
              <label className="label">Aktueller Arbeitgeber</label>
              <input className="input-field" value={form.current_company} onChange={e => set('current_company', e.target.value)} placeholder="Siemens AG" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Standort</label>
              <input className="input-field" value={form.location} onChange={e => set('location', e.target.value)} placeholder="München" />
            </div>
            <div>
              <label className="label">Gehaltswunsch</label>
              <input className="input-field" value={form.desired_salary} onChange={e => set('desired_salary', e.target.value)} placeholder="80.000 €" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kündigungsfrist</label>
              <input className="input-field" value={form.notice_period} onChange={e => set('notice_period', e.target.value)} placeholder="3 Monate" />
            </div>
            <div>
              <label className="label">Pipeline-Stage</label>
              <select className="input-field" value={form.pipeline_stage} onChange={e => set('pipeline_stage', e.target.value)}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Quelle</label>
            <select className="input-field" value={form.source} onChange={e => set('source', e.target.value)}>
              {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notizen</label>
            <textarea className="input-field resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Abbrechen</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors">
            {saving ? 'Speichern…' : 'Kandidat anlegen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Import from CV Modal ───────────────────────────────────────────────────────

function ImportCVModal({ onClose, onImport }) {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(null);
  const [showDone, setShowDone] = useState(null);

  useEffect(() => {
    api.get('/cvs').then(r => setCvs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleImport = async cv => {
    setImporting(cv.id);
    try {
      const { data } = await api.post(`/crm/candidates/from-cv/${cv.id}`);
      onImport(data);
      setShowDone(cv.id);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;
      if (status === 409) {
        // Already imported → just close and let parent reload
        onImport(null);
      } else {
        const detail = serverMsg || (status ? `HTTP ${status}` : 'Keine Serverantwort – Backend prüfen');
        alert(`Fehler beim Importieren: ${detail}`);
      }
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Aus Lebenslauf importieren</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>
          ) : cvs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Keine Lebensläufe vorhanden.</p>
          ) : (
            <ul className="space-y-2">
              {cvs.map(cv => (
                <li key={cv.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-brand/30 hover:bg-brand-50/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
                      <FileText size={14} className="text-brand" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">{cv.title}</span>
                  </div>
                  <button
                    onClick={() => handleImport(cv)}
                    disabled={importing === cv.id}
                    className="text-xs px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
                  >
                    {importing === cv.id ? '…' : 'Importieren'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Candidate Card ─────────────────────────────────────────────────────────────

function CandidateCard({ candidate, onSelect, onStageChange, isDragging }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('candidateId', candidate.id);
        e.dataTransfer.setData('fromStage', candidate.pipeline_stage);
      }}
      onClick={() => onSelect(candidate)}
      className={`bg-white rounded-xl border border-gray-200 p-3.5 cursor-pointer shadow-sm
        hover:shadow-md hover:border-brand/30 transition-all group select-none
        ${isDragging ? 'opacity-50 rotate-1' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand">
              {candidate.first_name?.[0]}{candidate.last_name?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {candidate.first_name} {candidate.last_name}
            </p>
            {candidate.current_position && (
              <p className="text-xs text-gray-500 truncate">{candidate.current_position}</p>
            )}
          </div>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
              {STAGES.filter(s => s.key !== candidate.pipeline_stage).map(s => (
                <button
                  key={s.key}
                  onClick={e => { e.stopPropagation(); onStageChange(candidate.id, s.key); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  → {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1">
        {candidate.current_company && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Briefcase size={11} className="shrink-0" />
            <span className="truncate">{candidate.current_company}</span>
          </p>
        )}
        {candidate.location && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{candidate.location}</span>
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          {candidate.email && (
            <a href={`mailto:${candidate.email}`} onClick={e => e.stopPropagation()}
              className="text-gray-400 hover:text-brand transition-colors">
              <Mail size={12} />
            </a>
          )}
          {candidate.phone && (
            <a href={`tel:${candidate.phone}`} onClick={e => e.stopPropagation()}
              className="text-gray-400 hover:text-brand transition-colors">
              <Phone size={12} />
            </a>
          )}
          {candidate.cv_id && (
            <span className="text-gray-400" title="Lebenslauf verknüpft">
              <FileText size={12} />
            </span>
          )}
        </div>
        {candidate.desired_salary && (
          <span className="text-xs text-gray-400">{candidate.desired_salary}</span>
        )}
      </div>
    </div>
  );
}

// ── Kanban Column ──────────────────────────────────────────────────────────────

function KanbanColumn({ stage, candidates, onSelect, onStageChange, onAddClick, draggingId }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = e => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const candidateId = parseInt(e.dataTransfer.getData('candidateId'));
    const fromStage = e.dataTransfer.getData('fromStage');
    if (fromStage !== stage.key) onStageChange(candidateId, stage.key);
  };

  const count = candidates.length;

  return (
    <div className="flex flex-col min-w-[220px] w-[220px] shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border border-b-0 ${stage.border} ${stage.light}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${stage.color}`} />
          <span className={`text-xs font-semibold ${stage.text}`}>{stage.label}</span>
        </div>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${stage.color} text-white`}>{count}</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 min-h-[500px] p-2 rounded-b-xl border ${stage.border} space-y-2 transition-colors
          ${dragOver ? `${stage.light} border-dashed` : 'bg-gray-50/50'}`}
      >
        {candidates.map(c => (
          <CandidateCard
            key={c.id}
            candidate={c}
            onSelect={onSelect}
            onStageChange={onStageChange}
            isDragging={draggingId === c.id}
          />
        ))}

        <button
          onClick={() => onAddClick(stage.key)}
          className={`w-full py-2 rounded-xl border-2 border-dashed text-xs text-gray-400
            hover:text-brand hover:border-brand/40 hover:bg-brand/5 transition-all flex items-center justify-center gap-1`}
        >
          <Plus size={12} /> Hinzufügen
        </button>
      </div>
    </div>
  );
}

// ── Main Kanban Board ──────────────────────────────────────────────────────────

export default function CandidatesKanban({ onSelectCandidate }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addStage, setAddStage] = useState('neu');
  const [showImport, setShowImport] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const searchTimer = useRef(null);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : '';
      const { data } = await api.get(`/crm/candidates${params}`);
      setCandidates(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = e => {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(q), 350);
  };

  const handleStageChange = async (candidateId, newStage) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, pipeline_stage: newStage } : c));
    try {
      await api.patch(`/crm/candidates/${candidateId}/stage`, { stage: newStage });
    } catch {
      load(search);
    }
  };

  const handleAddClick = stage => { setAddStage(stage); setShowAdd(true); };

  const handleSaved = candidate => {
    setCandidates(prev => [candidate, ...prev]);
    setShowAdd(false);
  };

  const handleImported = candidate => {
    setShowImport(false);
    if (candidate) {
      setCandidates(prev => [candidate, ...prev]);
    } else {
      load(search); // Already existed → refresh to show it
    }
  };

  const candidatesByStage = stage => candidates.filter(c => c.pipeline_stage === stage);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            placeholder="Kandidaten suchen…"
            value={search}
            onChange={handleSearch}
          />
        </div>
        <span className="text-sm text-gray-500">{candidates.length} Kandidaten</span>
        <div className="flex-1" />
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Download size={14} /> Aus CV importieren
        </button>
        <button
          onClick={() => handleAddClick('neu')}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors"
        >
          <Plus size={14} /> Kandidat anlegen
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage.key}
              stage={stage}
              candidates={candidatesByStage(stage.key)}
              onSelect={onSelectCandidate}
              onStageChange={handleStageChange}
              onAddClick={handleAddClick}
              draggingId={draggingId}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddCandidateModal initialStage={addStage} onClose={() => setShowAdd(false)} onSave={handleSaved} />
      )}
      {showImport && (
        <ImportCVModal onClose={() => setShowImport(false)} onImport={handleImported} />
      )}
    </div>
  );
}
