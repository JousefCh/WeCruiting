import { useState } from 'react';
import useCVStore from '../../store/cvStore';
import { CVExportTarget } from '../preview/CVPreviewPanel';
import CVPreviewPanel from '../preview/CVPreviewPanel';
import { exportCVToPDF } from '../../utils/pdfExport';
import CoverLetterModal from '../ai/CoverLetterModal';

export default function Step3Download({ onBack }) {
  const currentCV = useCVStore(s => s.currentCV);
  const [exporting, setExporting] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const { personalInfo: p = {} } = currentCV;
  const name = [p.firstName, p.lastName].filter(Boolean).join('_') || 'Lebenslauf';

  const handleExport = async () => {
    setExporting(true);
    try {
      const displayName = [p.firstName, p.lastName].filter(Boolean).join(' ');
      await exportCVToPDF('cv-export-target', `Lebenslauf_${name}`, displayName);
    } catch (err) {
      alert('PDF-Export fehlgeschlagen. Bitte erneut versuchen.');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Preview */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ihr Lebenslauf</h2>
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <CVPreviewPanel cvData={currentCV} />
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="lg:w-72 space-y-4">
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Exportieren & Herunterladen</h3>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Wird erstellt…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PDF herunterladen
                </>
              )}
            </button>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">KI-Anschreiben</h3>
              <p className="text-xs text-gray-500 mb-3">
                Lassen Sie ein professionelles Anschreiben für Ihre nächste Bewerbung erstellen.
              </p>
              <button
                onClick={() => setShowCoverLetter(true)}
                className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Anschreiben generieren
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <button onClick={onBack} className="text-sm text-gray-500 hover:text-brand flex items-center gap-1">
                ← Zurück zum Bearbeiten
              </button>
            </div>
          </div>

          <div className="card p-4 bg-brand-50 border-brand-100">
            <p className="text-xs text-brand-700 font-medium mb-1">Tipp</p>
            <p className="text-xs text-brand-600">
              Ihr Lebenslauf wird automatisch gespeichert. Sie können ihn jederzeit in Ihrem Dashboard bearbeiten.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden export target (full-size, off-screen) */}
      <CVExportTarget cvData={currentCV} id="cv-export-target" />

      {/* Cover Letter Modal */}
      {showCoverLetter && (
        <CoverLetterModal cvData={currentCV} onClose={() => setShowCoverLetter(false)} />
      )}
    </div>
  );
}
