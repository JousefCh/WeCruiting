import useCVStore from '../../store/cvStore';

const LEVEL_LABELS = ['', 'Einsteiger', 'Grundlagen', 'Fortgeschritten', 'Experte', 'Experte+'];
const EMPTY_SKILL = { name: '', level: 3 };

export default function SkillsSection() {
  const items = useCVStore(s => s.currentCV.skills);
  const addArrayItem = useCVStore(s => s.addArrayItem);
  const updateArrayItem = useCVStore(s => s.updateArrayItem);
  const removeArrayItem = useCVStore(s => s.removeArrayItem);

  const update = (id, field, value) => updateArrayItem('skills', id, { [field]: value });

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Kenntnisse eingetragen.</p>
      )}

      {items.map(skill => (
        <div key={skill.id} className="flex items-center gap-3 card p-3">
          <input
            className="input-field flex-1"
            placeholder="z.B. Microsoft Excel, Python, …"
            value={skill.name}
            onChange={e => update(skill.id, 'name', e.target.value)}
          />
          <div className="flex flex-col items-center gap-0.5 min-w-[100px]">
            <input
              type="range"
              min={1}
              max={5}
              value={skill.level}
              onChange={e => update(skill.id, 'level', Number(e.target.value))}
              className="w-full accent-brand"
            />
            <span className="text-xs text-brand font-medium">{LEVEL_LABELS[skill.level]}</span>
          </div>
          <button onClick={() => removeArrayItem('skills', skill.id)} className="text-red-400 hover:text-red-600 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <button
        onClick={() => addArrayItem('skills', EMPTY_SKILL)}
        className="w-full border-2 border-dashed border-brand-200 text-brand hover:bg-brand-50 rounded-lg py-2.5 text-sm font-medium transition-colors"
      >
        + Kenntnis hinzufügen
      </button>
    </div>
  );
}
