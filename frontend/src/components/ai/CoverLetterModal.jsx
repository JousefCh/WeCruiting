import { useState } from 'react';
import { generateCoverLetter } from '../../services/aiService';
import { exportTextToPDF } from '../../utils/pdfExport';

export default function CoverLetterModal({ cvData, onClose }) {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { personalInfo: p = {} } = cvData;
  const name = [p.firstName, p.lastName].filter(Boolean).join('_') || 'Anschreiben';

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !company.trim()) {
      setError('Bitte Stelle und Unternehmen angeben.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await generateCoverLetter(cvData, jobTitle, company, jobDescription);
      setCoverLetter(result.coverLetter);
    } catch (err) {
      setError(err.response?.data?.error || 'Anschreiben konnte nicht erstellt werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    exportTextToPDF(coverLetter, `Anschreiben_${name}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">KI-Anschreiben-Generator</h2>
            <p className="text-sm text-gray-500 mt-0.5">Powered by Claude AI</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Zielposition *</label>
              <input
                className="input-field"
                placeholder="z.B. Projektmanager"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Unternehmen *</label>
              <input
                className="input-field"
                placeholder="z.B. Muster AG"
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Stellenbeschreibung (optional)</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Fügen Sie hier die Stellenbeschreibung ein, um ein individuelleres Anschreiben zu erhalten…"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                KI erstellt Ihr Anschreiben…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Anschreiben generieren
              </>
            )}
          </button>

          {/* Generated text */}
          {coverLetter && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm">Generiertes Anschreiben</h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="btn-secondary text-xs py-1.5 px-3">
                    {copied ? '✓ Kopiert!' : 'Kopieren'}
                  </button>
                  <button onClick={handleDownload} className="btn-primary text-xs py-1.5 px-3">
                    Als PDF speichern
                  </button>
                </div>
              </div>
              <textarea
                className="input-field resize-none font-mono text-sm leading-relaxed"
                rows={18}
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
              />
              <p className="text-xs text-gray-400">Das Anschreiben kann direkt bearbeitet werden.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
