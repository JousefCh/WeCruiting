import useCVStore from '../../store/cvStore';

const LEVELS = ['Grundkenntnisse', 'Gut', 'Sehr gut', 'Fließend', 'Verhandlungssicher', 'Muttersprache'];
const EMPTY_LANG = { language: '', level: 'Sehr gut' };

export default function LanguagesSection() {
  const items = useCVStore(s => s.currentCV.languages);
  const addArrayItem = useCVStore(s => s.addArrayItem);
  const updateArrayItem = useCVStore(s => s.updateArrayItem);
  const removeArrayItem = useCVStore(s => s.removeArrayItem);

  const update = (id, field, value) => updateArrayItem('languages', id, { [field]: value });

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Sprachkenntnisse eingetragen.</p>
      )}

      {items.map(lang => (
        <div key={lang.id} className="flex items-center gap-3 card p-3">
          <input
            className="input-field flex-1"
            placeholder="z.B. Deutsch, Englisch, …"
            value={lang.language}
            onChange={e => update(lang.id, 'language', e.target.value)}
          />
          <select
            className="input-field w-44"
            value={lang.level}
            onChange={e => update(lang.id, 'level', e.target.value)}
          >
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={() => removeArrayItem('languages', lang.id)} className="text-red-400 hover:text-red-600 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <button
        onClick={() => addArrayItem('languages', EMPTY_LANG)}
        className="w-full border-2 border-dashed border-brand-200 text-brand hover:bg-brand-50 rounded-lg py-2.5 text-sm font-medium transition-colors"
      >
        + Sprache hinzufügen
      </button>
    </div>
  );
}
