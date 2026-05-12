import { useState, useEffect } from 'react';
import { Plus, Building2, Globe, MapPin, Users, Briefcase, X, ChevronDown, ChevronRight, Mail, Phone } from 'lucide-react';
import api from '../../services/api';

function AddCompanyModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', domain: '', industry: '', size: '', city: '', country: 'Deutschland', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name ist erforderlich.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/crm/companies', form);
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
          <h3 className="font-semibold text-gray-900">Neues Unternehmen</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="label">Unternehmensname *</label>
            <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Siemens AG" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Website / Domain</label>
              <input className="input-field" value={form.domain} onChange={e => set('domain', e.target.value)} placeholder="siemens.com" />
            </div>
            <div>
              <label className="label">Branche</label>
              <input className="input-field" value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="Maschinenbau" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Unternehmensgröße</label>
              <select className="input-field" value={form.size} onChange={e => set('size', e.target.value)}>
                <option value="">– wählen –</option>
                <option value="1-10">1–10 Mitarbeiter</option>
                <option value="11-50">11–50 Mitarbeiter</option>
                <option value="51-200">51–200 Mitarbeiter</option>
                <option value="201-1000">201–1.000 Mitarbeiter</option>
                <option value="1000+">1.000+ Mitarbeiter</option>
              </select>
            </div>
            <div>
              <label className="label">Stadt</label>
              <input className="input-field" value={form.city} onChange={e => set('city', e.target.value)} placeholder="München" />
            </div>
          </div>
          <div>
            <label className="label">Notizen</label>
            <textarea className="input-field resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Abbrechen</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50">
            {saving ? 'Speichern…' : 'Unternehmen anlegen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddContactModal({ company, onClose, onSave }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', position: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.first_name.trim()) { setError('Vorname ist erforderlich.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/crm/contacts', { ...form, company_id: company.id });
      onSave(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Neuer Ansprechpartner</h3>
            <p className="text-xs text-gray-500">{company.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vorname *</label>
              <input className="input-field" value={form.first_name} onChange={e => set('first_name', e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Nachname</label>
              <input className="input-field" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Position</label>
            <input className="input-field" value={form.position} onChange={e => set('position', e.target.value)} placeholder="Head of HR" />
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
        </form>
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Abbrechen</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50">
            {saving ? 'Speichern…' : 'Kontakt anlegen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompanyRow({ company, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const loadContacts = async () => {
    if (contacts.length > 0) { setExpanded(e => !e); return; }
    setExpanded(true);
    setLoadingContacts(true);
    try {
      const { data } = await api.get(`/crm/contacts?company_id=${company.id}`);
      setContacts(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleContactSaved = contact => {
    setContacts(prev => [...prev, contact]);
    setShowAddContact(false);
  };

  const handleDeleteContact = async id => {
    try {
      await api.delete(`/crm/contacts/${id}`);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4 p-4">
        <button onClick={loadContacts} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{company.name}</h3>
            {company.industry && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{company.industry}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5 flex-wrap">
            {company.domain && (
              <span className="flex items-center gap-1"><Globe size={11} />{company.domain}</span>
            )}
            {company.city && (
              <span className="flex items-center gap-1"><MapPin size={11} />{company.city}</span>
            )}
            {company.size && <span>{company.size}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
          <span className="flex items-center gap-1"><Users size={12} />{company.contact_count || 0}</span>
          <span className="flex items-center gap-1"><Briefcase size={12} />{company.open_jobs || 0} offen</span>
        </div>
        <button onClick={() => onDelete(company.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0">
          <X size={14} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {loadingContacts ? (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {contacts.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Noch keine Ansprechpartner</p>
                ) : contacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100 group">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-gray-600">
                        {contact.first_name?.[0]}{contact.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {contact.first_name} {contact.last_name}
                        {contact.position && <span className="font-normal text-gray-500"> · {contact.position}</span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-brand">
                            <Mail size={10} />{contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-brand">
                            <Phone size={10} />{contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAddContact(true)}
                className="flex items-center gap-1 text-xs text-brand hover:underline"
              >
                <Plus size={12} /> Ansprechpartner hinzufügen
              </button>
            </>
          )}
        </div>
      )}

      {showAddContact && (
        <AddContactModal company={company} onClose={() => setShowAddContact(false)} onSave={handleContactSaved} />
      )}
    </div>
  );
}

export default function CompaniesList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/crm/companies');
      setCompanies(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaved = company => { setCompanies(prev => [company, ...prev]); setShowAdd(false); };

  const handleDelete = async id => {
    if (!window.confirm('Unternehmen wirklich löschen?')) return;
    try {
      await api.delete(`/crm/companies/${id}`);
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch {
      /* ignore */
    }
  };

  const filtered = search
    ? companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry || '').toLowerCase().includes(search.toLowerCase())
      )
    : companies;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Unternehmen suchen…"
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
        <span className="text-sm text-gray-500">{filtered.length} Unternehmen</span>
        <div className="flex-1" />
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors"
        >
          <Plus size={14} /> Unternehmen anlegen
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Noch keine Unternehmen</p>
          <p className="text-sm text-gray-400 mt-1">Füge Kunden und Auftraggeber hinzu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(company => (
            <CompanyRow key={company.id} company={company} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} onSave={handleSaved} />}
    </div>
  );
}
