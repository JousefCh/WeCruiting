import { useRef } from 'react';

export default function PhotoUpload({ photo, onPhotoChange }) {
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPhotoChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer hover:border-brand transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {photo ? (
          <img src={photo} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>
      <div>
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary text-sm py-1.5">
          {photo ? 'Foto ändern' : 'Foto hochladen'}
        </button>
        {photo && (
          <button type="button" onClick={() => onPhotoChange(null)} className="block text-xs text-red-500 hover:text-red-700 mt-1">
            Entfernen
          </button>
        )}
        <p className="text-xs text-gray-400 mt-1">JPG, PNG · empfohlen: quadratisch</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
