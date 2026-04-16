export default function CVCard({ cv, onEdit, onDelete, isDeleting }) {
  const updated = new Date(cv.updated_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="card p-6 hover:shadow-md transition-shadow flex flex-col gap-4">
      {/* Preview thumbnail or placeholder */}
      <div
        className="w-full h-40 rounded-lg overflow-hidden bg-brand-50 flex items-center justify-center border border-gray-100 cursor-pointer"
        onClick={onEdit}
      >
        {cv.thumbnail ? (
          <img src={cv.thumbnail} alt={cv.title} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="flex flex-col items-center text-brand-300">
            <svg className="w-12 h-12 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">Vorschau</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 truncate">{cv.title}</h3>
        <p className="text-xs text-gray-400 mt-1">Zuletzt geändert: {updated}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 btn-primary text-sm py-2"
        >
          Bearbeiten
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
          title="Löschen"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
