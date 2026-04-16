import { useState } from 'react';
import useCVStore from '../../store/cvStore';

export default function HobbiesSection() {
  const hobbies = useCVStore(s => s.currentCV.hobbies);
  const setHobbies = useCVStore(s => s.setHobbies);
  const [input, setInput] = useState('');

  const addHobby = () => {
    const trimmed = input.trim();
    if (trimmed && !hobbies.includes(trimmed)) {
      setHobbies([...hobbies, trimmed]);
    }
    setInput('');
  };

  const removeHobby = (h) => setHobbies(hobbies.filter(x => x !== h));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="z.B. Fotografie, Yoga, Reisen…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHobby())}
        />
        <button onClick={addHobby} className="btn-primary px-4">
          Hinzufügen
        </button>
      </div>

      {hobbies.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {hobbies.map(h => (
            <span key={h} className="inline-flex items-center gap-1.5 bg-brand-50 text-brand text-sm px-3 py-1.5 rounded-full font-medium">
              {h}
              <button onClick={() => removeHobby(h)} className="text-brand-400 hover:text-brand-700 leading-none">×</button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Hobbys und Interessen eintippen und Enter drücken.</p>
      )}
    </div>
  );
}
