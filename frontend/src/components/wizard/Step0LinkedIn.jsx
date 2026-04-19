import { useRef, useState } from 'react';
import { importLinkedInProfile } from '../../services/linkedinService';

// ─── sub-components ──────────────────────────────────────────────────────────

function InstructionStep({ number, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-[#0077B5] text-white text-sm font-bold flex items-center justify-center shrink-0">
        {number}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{text}</p>
    </div>
  );
}

function ImportSummary({ data }) {
  const { personalInfo = {}, workExperience = [], education = [], skills = [], languages = [] } = data;
  const name = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ');

  const rows = [
    { label: 'Name', value: name || '–' },
    { label: 'E-Mail', value: personalInfo.email || '–' },
    { label: 'Stadt', value: personalInfo.city || '–' },
    { label: 'Berufserfahrung', value: workExperience.length ? `${workExperience.length} Einträge` : '–' },
    { label: 'Ausbildung', value: education.length ? `${education.length} Einträge` : '–' },
    { label: 'Fähigkeiten', value: skills.length ? `${skills.length} Einträge` : '–' },
    { label: 'Sprachen', value: languages.length ? `${languages.length} Einträge` : '–' },
  ];

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="font-semibold text-green-800 text-sm">Profil erfolgreich analysiert</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function Step0LinkedIn({ onImport, onSkip }) {
  const [profileUrl, setProfileUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedData, setImportedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Bitte laden Sie nur PDF-Dateien hoch.');
      return;
    }
    setPdfFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    setError('');
    if (!pdfFile) {
      setError('Bitte wählen Sie zuerst eine PDF-Datei aus.');
      return;
    }
    setLoading(true);
    try {
      const data = await importLinkedInProfile(pdfFile, profileUrl);
      setImportedData(data);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        (err?.message && !err.message.includes('Network Error') ? err.message : null) ||
        'Der Import ist fehlgeschlagen. Bitte starten Sie den Server neu und versuchen Sie es erneut.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (importedData) onImport(importedData);
  };

  const handleReset = () => {
    setImportedData(null);
    setPdfFile(null);
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-[#0077B5] text-white px-4 py-2 rounded-xl mb-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span className="font-bold text-sm tracking-wide">LinkedIn Import</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">LinkedIn-Profil importieren</h2>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          Exportieren Sie Ihr LinkedIn-Profil als PDF und laden Sie es hoch –<br />
          Ihre Daten werden automatisch in den Lebenslauf übernommen.
        </p>
      </div>

      <div className="card p-6 space-y-6">
        {/* Instructions */}
        {!importedData && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-800 mb-1">So exportieren Sie Ihr LinkedIn-Profil als PDF:</p>
            <InstructionStep number={1} text='Öffnen Sie Ihr LinkedIn-Profil im Browser.' />
            <InstructionStep number={2} text='Klicken Sie auf „Mehr" und dann auf „Als PDF speichern".' />
            <InstructionStep number={3} text='Laden Sie die heruntergeladene PDF-Datei unten hoch.' />
          </div>
        )}

        {/* Success summary */}
        {importedData && <ImportSummary data={importedData} />}

        {!importedData && (
          <>
            {/* Drop zone */}
            <div>
              <label className="label">LinkedIn-Profil als PDF hochladen</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
                  dragging
                    ? 'border-[#0077B5] bg-blue-50'
                    : pdfFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-[#0077B5] hover:bg-blue-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {pdfFile ? (
                  <>
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-center">
                      <p className="font-semibold text-green-700 text-sm">{pdfFile.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(pdfFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                      className="text-xs text-red-400 hover:text-red-600 underline"
                    >
                      Datei entfernen
                    </button>
                  </>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">PDF hier ablegen oder <span className="text-[#0077B5]">Datei auswählen</span></p>
                      <p className="text-xs text-gray-400 mt-1">Nur PDF, max. 10 MB</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Optional URL field */}
            <div>
              <label className="label">LinkedIn-Profil-URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="url"
                className="input-field"
                placeholder="https://www.linkedin.com/in/ihr-profil/"
                value={profileUrl}
                onChange={e => setProfileUrl(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {importedData ? (
            <>
              <button onClick={handleConfirm} className="btn-primary flex-1 py-3 text-base font-semibold">
                Daten übernehmen &amp; Lebenslauf erstellen →
              </button>
              <button onClick={handleReset} className="btn-secondary px-5 py-3 text-sm">
                Neu importieren
              </button>
            </>
          ) : (
            <button
              onClick={handleImport}
              disabled={loading || !pdfFile}
              className="btn-primary flex-1 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Profil wird analysiert…
                </span>
              ) : (
                'Profil importieren'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Skip link */}
      <div className="text-center mt-5">
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Ohne Import fortfahren – Daten manuell eingeben
        </button>
      </div>
    </div>
  );
}
