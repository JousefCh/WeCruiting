import useCVStore from '../../store/cvStore';

const EMPTY_EDU = { institution: '', degree: '', field: '', startDate: '', endDate: '', current: false, grade: '' };

export default function EducationSection() {
  const items = useCVStore(s => s.currentCV.education);
  const addArrayItem = useCVStore(s => s.addArrayItem);
  const updateArrayItem = useCVStore(s => s.updateArrayItem);
  const removeArrayItem = useCVStore(s => s.removeArrayItem);

  const update = (id, field, value) => updateArrayItem('education', id, { [field]: value });

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Einträge. Fügen Sie Ihren Bildungsweg hinzu.</p>
      )}

      {items.map((edu, idx) => (
        <div key={edu.id} className="card p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ausbildung {idx + 1}</span>
            <button onClick={() => removeArrayItem('education', edu.id)} className="text-xs text-red-500 hover:text-red-700">
              Entfernen
            </button>
          </div>

          <div>
            <label className="label">Bildungseinrichtung</label>
            <input className="input-field" placeholder="Universität Berlin" value={edu.institution} onChange={e => update(edu.id, 'institution', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Abschluss</label>
              <input className="input-field" placeholder="Bachelor of Science" value={edu.degree} onChange={e => update(edu.id, 'degree', e.target.value)} />
            </div>
            <div>
              <label className="label">Fachrichtung</label>
              <input className="input-field" placeholder="Informatik" value={edu.field} onChange={e => update(edu.id, 'field', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Von</label>
              <input className="input-field" placeholder="10/2015" value={edu.startDate} onChange={e => update(edu.id, 'startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Bis</label>
              <input className="input-field" placeholder="09/2018" value={edu.endDate} disabled={edu.current} onChange={e => update(edu.id, 'endDate', e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-brand" checked={edu.current || false} onChange={e => update(edu.id, 'current', e.target.checked)} />
            <span className="text-sm text-gray-600">Aktuell noch eingeschrieben</span>
          </label>

          <div>
            <label className="label">Abschlussnote (optional)</label>
            <input className="input-field" placeholder="1,5" value={edu.grade} onChange={e => update(edu.id, 'grade', e.target.value)} />
          </div>
        </div>
      ))}

      <button
        onClick={() => addArrayItem('education', EMPTY_EDU)}
        className="w-full border-2 border-dashed border-brand-200 text-brand hover:bg-brand-50 rounded-lg py-2.5 text-sm font-medium transition-colors"
      >
        + Ausbildung hinzufügen
      </button>
    </div>
  );
}
