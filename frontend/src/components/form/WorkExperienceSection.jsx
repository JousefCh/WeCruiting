import useCVStore from '../../store/cvStore';

const EMPTY_JOB = { company: '', position: '', startDate: '', endDate: '', current: false, description: '' };

function BulletTextarea({ value, onChange }) {
  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    // Find the start of the current line
    const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
    const currentLine = text.substring(lineStart, cursorPos);

    // If current line starts with a bullet, continue bullet on next line
    if (currentLine.startsWith('• ')) {
      e.preventDefault();
      // If line is just "• " (empty bullet), remove bullet and stop
      if (currentLine === '• ') {
        const newText = text.substring(0, lineStart) + text.substring(cursorPos);
        onChange(newText);
        // Move cursor back
        setTimeout(() => {
          textarea.selectionStart = lineStart;
          textarea.selectionEnd = lineStart;
        }, 0);
        return;
      }
      const newText = text.substring(0, cursorPos) + '\n• ' + text.substring(cursorPos);
      onChange(newText);
      setTimeout(() => {
        textarea.selectionStart = cursorPos + 3;
        textarea.selectionEnd = cursorPos + 3;
      }, 0);
    }
  };

  const addBullet = (e) => {
    e.preventDefault();
    const textarea = document.activeElement;
    const cursorPos = (textarea && textarea.tagName === 'TEXTAREA') ? textarea.selectionStart : value.length;
    const text = value;

    // If empty or ends with newline, just add bullet
    if (!text || text.endsWith('\n') || text === '') {
      onChange(text + '• ');
    } else {
      // Add newline + bullet at cursor position
      const newText = text.substring(0, cursorPos) + '\n• ' + text.substring(cursorPos);
      onChange(newText);
    }
    // Refocus textarea
    setTimeout(() => textarea?.focus?.(), 0);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">Tätigkeitsbeschreibung</label>
        <button
          type="button"
          onClick={addBullet}
          className="text-xs text-brand hover:text-brand-700 font-medium flex items-center gap-1 px-2 py-0.5 rounded hover:bg-brand-50 transition-colors"
          title="Stichpunkt hinzufügen"
        >
          <span className="text-base leading-none">•</span> Stichpunkt
        </button>
      </div>
      <textarea
        className="input-field resize-none font-sans"
        rows={4}
        placeholder="Beschreiben Sie Ihre Aufgaben…&#10;• Oder klicken Sie auf &quot;Stichpunkt&quot;"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <p className="text-xs text-gray-400 mt-1">Tipp: Nach einem Stichpunkt (•) wird mit Enter automatisch ein neuer Stichpunkt erstellt.</p>
    </div>
  );
}

export default function WorkExperienceSection() {
  const items = useCVStore(s => s.currentCV.workExperience);
  const addArrayItem = useCVStore(s => s.addArrayItem);
  const updateArrayItem = useCVStore(s => s.updateArrayItem);
  const removeArrayItem = useCVStore(s => s.removeArrayItem);

  const update = (id, field, value) => updateArrayItem('workExperience', id, { [field]: value });

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Einträge. Fügen Sie Ihre erste Stelle hinzu.</p>
      )}

      {items.map((job, idx) => (
        <div key={job.id} className="card p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stelle {idx + 1}</span>
            <button
              onClick={() => removeArrayItem('workExperience', job.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Entfernen
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Position / Berufsbezeichnung</label>
              <input className="input-field" placeholder="Softwareentwickler" value={job.position} onChange={e => update(job.id, 'position', e.target.value)} />
            </div>
            <div>
              <label className="label">Unternehmen</label>
              <input className="input-field" placeholder="Muster GmbH" value={job.company} onChange={e => update(job.id, 'company', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Von</label>
              <input className="input-field" placeholder="01/2020" value={job.startDate} onChange={e => update(job.id, 'startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Bis</label>
              <input className="input-field" placeholder="12/2023" value={job.endDate} disabled={job.current} onChange={e => update(job.id, 'endDate', e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-brand"
              checked={job.current || false}
              onChange={e => update(job.id, 'current', e.target.checked)}
            />
            <span className="text-sm text-gray-600">Aktuelle Stelle</span>
          </label>

          <BulletTextarea
            value={job.description}
            onChange={val => update(job.id, 'description', val)}
          />
        </div>
      ))}

      <button
        onClick={() => addArrayItem('workExperience', EMPTY_JOB)}
        className="w-full border-2 border-dashed border-brand-200 text-brand hover:bg-brand-50 rounded-lg py-2.5 text-sm font-medium transition-colors"
      >
        + Stelle hinzufügen
      </button>
    </div>
  );
}
