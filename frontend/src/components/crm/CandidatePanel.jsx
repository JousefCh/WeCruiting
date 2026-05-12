import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Mail, Phone, MapPin, Briefcase, DollarSign, Clock, FileText,
  MessageSquare, PhoneCall, Calendar, ChevronDown, Trash2, Plus,
  Check, ExternalLink, Edit2, Save, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

const STAGES = [
  { key: 'neu',         label: 'Neu',         color: 'bg-gray-400',   text: 'text-gray-600',   light: 'bg-gray-100' },
  { key: 'kontaktiert', label: 'Kontaktiert',  color: 'bg-blue-500',   text: 'text-blue-700',   light: 'bg-blue-50' },
  { key: 'vorgestellt', label: 'Vorgestellt',  color: 'bg-violet-500', text: 'text-violet-700', light: 'bg-violet-50' },
  { key: 'interview',   label: 'Interview',    color: 'bg-amber-500',  text: 'text-amber-700',  light: 'bg-amber-50' },
  { key: 'angebot',     label: 'Angebot',      color: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50' },
  { key: 'platziert',   label: 'Platziert',    color: 'bg-green-500',  text: 'text-green-700',  light: 'bg-green-50' },
  { key: 'inaktiv',     label: 'Inaktiv',      color: 'bg-gray-300',   text: 'text-gray-500',   light: 'bg-gray-50' },
];

const ACTIVITY_TYPES = [
  { key: 'notiz',    label: 'Notiz',      Icon: MessageSquare, color: 'text-gray-500' },
  { key: 'anruf',   label: 'Anruf',      Icon: PhoneCall,     color: 'text-blue-500' },
  { key: 'email',   label: 'E-Mail',     Icon: Mail,          color: 'text-violet-500' },
  { key: 'meeting', label: 'Meeting',    Icon: Calendar,      color: 'text-amber-500' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ActivityItem({ activity, onDelete }) {
  const type = ACTIVITY_TYPES.find(t => t.key === activity.type) || ACTIVITY_TYPES[0];
  const { Icon } = type;

  return (
    <div className="flex gap-3 group">
      <div className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5 ${type.color}`}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {activity.type === 'status_aenderung' ? (
              <p className="text-xs text-gray-500 italic">{activity.content}</p>
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{activity.content}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.created_at)}</p>
          </div>
          <button
            onClick={() => onDelete(activity.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Field ─────────────────────────────────────────────────────────────────

function EditField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
      />
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export default function CandidatePanel({ candidate: initialCandidate, onClose, onUpdate, onDelete }) {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(initialCandidate);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [activityType, setActivityType] = useState('notiz');
  const [activityText, setActivityText] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCandidate(initialCandidate);
    setForm(initialCandidate);
    setEditing(false);
    loadDetail(initialCandidate.id);
  }, [initialCandidate.id]);

  const loadDetail = async id => {
    setLoading(true);
    try {
      const { data } = await api.get(`/crm/candidates/${id}`);
      setCandidate(data);
      setForm(data);
      setActivities(data.activities || []);
      setTasks(data.tasks || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/crm/candidates/${candidate.id}`, form);
      setCandidate(data);
      setForm(data);
      setEditing(false);
      onUpdate?.(data);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async stage => {
    setStageOpen(false);
    const updated = { ...candidate, pipeline_stage: stage };
    setCandidate(updated);
    try {
      await api.patch(`/crm/candidates/${candidate.id}/stage`, { stage });
      onUpdate?.(updated);
      loadDetail(candidate.id);
    } catch {
      setCandidate(candidate);
    }
  };

  const handleAddActivity = async () => {
    if (!activityText.trim()) return;
    setAddingActivity(true);
    try {
      const { data } = await api.post('/crm/activities', {
        entity_type: 'candidate', entity_id: candidate.id,
        type: activityType, content: activityText.trim(),
      });
      setActivities(prev => [data, ...prev]);
      setActivityText('');
    } catch {
      /* ignore */
    } finally {
      setAddingActivity(false);
    }
  };

  const handleDeleteActivity = async id => {
    try {
      await api.delete(`/crm/activities/${id}`);
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleAddTask = async () => {
    if (!taskText.trim()) return;
    setAddingTask(true);
    try {
      const { data } = await api.post('/crm/tasks', {
        entity_type: 'candidate', entity_id: candidate.id, title: taskText.trim(),
      });
      setTasks(prev => [data, ...prev]);
      setTaskText('');
    } catch {
      /* ignore */
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async id => {
    try {
      const { data } = await api.patch(`/crm/tasks/${id}/toggle`);
      setTasks(prev => prev.map(t => t.id === id ? data : t));
    } catch {
      /* ignore */
    }
  };

  const handleDeleteTask = async id => {
    try {
      await api.delete(`/crm/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`${candidate.first_name} ${candidate.last_name} wirklich löschen?`)) return;
    try {
      await api.delete(`/crm/candidates/${candidate.id}`);
      onDelete?.(candidate.id);
      onClose();
    } catch {
      /* ignore */
    }
  };

  const currentStage = STAGES.find(s => s.key === candidate.pipeline_stage) || STAGES[0];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-brand">
                {candidate.first_name?.[0]}{candidate.last_name?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {candidate.first_name} {candidate.last_name}
              </p>
              {candidate.current_position && (
                <p className="text-xs text-gray-500 truncate">{candidate.current_position}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!editing ? (
              <button onClick={() => { setEditing(true); setForm(candidate); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors">
                <Edit2 size={15} />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors">
                <Save size={12} />{saving ? '…' : 'Speichern'}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Pipeline Stage */}
          <div className="px-5 py-3 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Pipeline-Stage</span>
              <div className="relative">
                <button
                  onClick={() => setStageOpen(o => !o)}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${currentStage.light} ${currentStage.text} hover:opacity-80 transition-opacity`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentStage.color}`} />
                  {currentStage.label}
                  <ChevronDown size={12} />
                </button>
                {stageOpen && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                    {STAGES.map(s => (
                      <button key={s.key} onClick={() => handleStageChange(s.key)}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2
                          ${s.key === candidate.pipeline_stage ? 'font-semibold' : ''}`}>
                        <span className={`w-2 h-2 rounded-full ${s.color}`} />
                        {s.label}
                        {s.key === candidate.pipeline_stage && <Check size={10} className="ml-auto text-brand" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="px-5 py-4 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kontakt</p>
            {editing ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <EditField label="Vorname" value={form.first_name} onChange={v => set('first_name', v)} />
                  <EditField label="Nachname" value={form.last_name} onChange={v => set('last_name', v)} />
                </div>
                <EditField label="E-Mail" value={form.email} onChange={v => set('email', v)} type="email" />
                <EditField label="Telefon" value={form.phone} onChange={v => set('phone', v)} />
                <EditField label="Standort" value={form.location} onChange={v => set('location', v)} />
              </div>
            ) : (
              <div className="space-y-2">
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand transition-colors">
                    <Mail size={13} className="text-gray-400" />{candidate.email}
                  </a>
                )}
                {candidate.phone && (
                  <a href={`tel:${candidate.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand transition-colors">
                    <Phone size={13} className="text-gray-400" />{candidate.phone}
                  </a>
                )}
                {candidate.location && (
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={13} className="text-gray-400" />{candidate.location}
                  </p>
                )}
                {!candidate.email && !candidate.phone && !candidate.location && (
                  <p className="text-sm text-gray-400 italic">Keine Kontaktdaten hinterlegt</p>
                )}
              </div>
            )}
          </div>

          {/* Job details */}
          <div className="px-5 py-4 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Berufliches</p>
            {editing ? (
              <div className="space-y-2">
                <EditField label="Position" value={form.current_position} onChange={v => set('current_position', v)} placeholder="Senior Developer" />
                <EditField label="Arbeitgeber" value={form.current_company} onChange={v => set('current_company', v)} placeholder="Siemens AG" />
                <div className="grid grid-cols-2 gap-2">
                  <EditField label="Gehaltswunsch" value={form.desired_salary} onChange={v => set('desired_salary', v)} placeholder="80.000 €" />
                  <EditField label="Kündigungsfrist" value={form.notice_period} onChange={v => set('notice_period', v)} placeholder="3 Monate" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {candidate.current_company && (
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    <Briefcase size={13} className="text-gray-400" />
                    {candidate.current_position && <span>{candidate.current_position} bei </span>}
                    <span className="font-medium">{candidate.current_company}</span>
                  </p>
                )}
                {candidate.desired_salary && (
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={13} className="text-gray-400" />{candidate.desired_salary}
                  </p>
                )}
                {candidate.notice_period && (
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={13} className="text-gray-400" />{candidate.notice_period}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="px-5 py-4 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notizen</p>
            {editing ? (
              <textarea
                value={form.notes || ''}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Interne Notizen zum Kandidaten…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {candidate.notes || <span className="text-gray-400 italic">Keine Notizen</span>}
              </p>
            )}
          </div>

          {/* CV Link */}
          {candidate.cv_id && (
            <div className="px-5 py-3 border-b">
              <button
                onClick={() => navigate(`/lebenslauf/${candidate.cv_id}`)}
                className="flex items-center gap-2 text-sm text-brand hover:underline"
              >
                <FileText size={13} />
                {candidate.cv_title || 'Lebenslauf öffnen'}
                <ExternalLink size={11} />
              </button>
            </div>
          )}

          {/* Tasks */}
          <div className="px-5 py-4 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Aufgaben</p>
            <div className="flex gap-2 mb-3">
              <input
                value={taskText}
                onChange={e => setTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Neue Aufgabe…"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <button
                onClick={handleAddTask}
                disabled={addingTask || !taskText.trim()}
                className="px-3 py-1.5 bg-brand text-white text-sm rounded-lg hover:bg-brand/90 disabled:opacity-40 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                      ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-brand'}`}
                  >
                    {task.completed ? <Check size={11} className="text-white" /> : null}
                  </button>
                  <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-gray-400 italic">Keine Aufgaben</p>}
            </div>
          </div>

          {/* Activity log */}
          <div className="px-5 py-4 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Aktivitäten</p>

            {/* Add activity */}
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                {ACTIVITY_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActivityType(t.key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors
                      ${activityType === t.key ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand/40'}`}
                  >
                    <t.Icon size={11} />{t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={activityText}
                  onChange={e => setActivityText(e.target.value)}
                  placeholder={`${ACTIVITY_TYPES.find(t => t.key === activityType)?.label} hinzufügen…`}
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
                <button
                  onClick={handleAddActivity}
                  disabled={addingActivity || !activityText.trim()}
                  className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-40 self-end transition-colors"
                >
                  {addingActivity ? '…' : <Plus size={14} />}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Noch keine Aktivitäten</p>
              ) : (
                activities.map(a => (
                  <ActivityItem key={a.id} activity={a} onDelete={handleDeleteActivity} />
                ))
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="px-5 py-4">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={13} /> Kandidat löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
