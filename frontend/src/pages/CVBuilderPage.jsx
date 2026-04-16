import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCVStore from '../store/cvStore';
import WizardStepper from '../components/wizard/WizardStepper';
import Step1Template from '../components/wizard/Step1Template';
import Step2Editor from '../components/wizard/Step2Editor';
import Step3Download from '../components/wizard/Step3Download';

export default function CVBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { initNewCV, loadCV, saveCV, setStep, wizardStep, currentCV, isDirty, isSaving, lastSaved, setTitle } = useCVStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const autoSaveTimer = useRef(null);

  // Load or init CV
  useEffect(() => {
    const init = async () => {
      try {
        if (id) {
          await loadCV(id);
        } else {
          initNewCV();
        }
      } catch {
        setError('Lebenslauf konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // Auto-save when dirty and CV has been saved at least once
  useEffect(() => {
    if (!isDirty || !currentCV.id) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveCV().catch(() => {});
    }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [isDirty, currentCV]);

  const handleNextFromStep1 = () => setStep(2);

  const handleNextFromStep2 = async () => {
    try {
      const savedId = await saveCV();
      if (!id && savedId) {
        // Replace URL so browser back works properly
        navigate(`/lebenslauf/${savedId}`, { replace: true });
      }
      setStep(3);
    } catch {
      alert('Speichern fehlgeschlagen. Bitte erneut versuchen.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Zurück zum Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      {/* Top bar with title + save status */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-4">
        <input
          className="text-sm font-semibold text-gray-800 border-none outline-none bg-transparent hover:bg-gray-50 focus:bg-gray-50 px-2 py-1 rounded"
          value={currentCV.title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titel des Lebenslaufs"
        />
        <div className="ml-auto flex items-center gap-3">
          {isSaving && <span className="text-xs text-gray-400">Wird gespeichert…</span>}
          {!isSaving && lastSaved && (
            <span className="text-xs text-gray-400">
              Gespeichert um {lastSaved.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {isDirty && !isSaving && <span className="text-xs text-amber-500">● Ungespeicherte Änderungen</span>}
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-100">
        <WizardStepper currentStep={wizardStep} onStepClick={setStep} />
      </div>

      {/* Step content */}
      <div className={wizardStep !== 2 ? 'pt-6' : ''}>
        {wizardStep === 1 && <Step1Template onNext={handleNextFromStep1} />}
        {wizardStep === 2 && <Step2Editor onBack={() => setStep(1)} onNext={handleNextFromStep2} />}
        {wizardStep === 3 && <Step3Download onBack={() => setStep(2)} />}
      </div>
    </div>
  );
}
