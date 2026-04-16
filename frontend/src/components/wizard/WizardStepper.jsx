const STEPS = [
  { number: 1, label: 'Vorlage wählen' },
  { number: 2, label: 'Daten eingeben' },
  { number: 3, label: 'PDF herunterladen' },
];

export default function WizardStepper({ currentStep, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-0 py-6 px-4">
      {STEPS.map((step, idx) => {
        const done = currentStep > step.number;
        const active = currentStep === step.number;
        const clickable = done || (step.number < currentStep);

        return (
          <div key={step.number} className="flex items-center">
            <button
              onClick={() => clickable && onStepClick(step.number)}
              disabled={!clickable}
              className={`flex items-center gap-2.5 group ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {/* Circle */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                active
                  ? 'bg-brand text-white shadow-md shadow-brand/30'
                  : done
                  ? 'bg-brand-100 text-brand'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.number}
              </div>
              {/* Label */}
              <span className={`text-sm font-medium hidden sm:block ${
                active ? 'text-brand' : done ? 'text-brand-400' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </button>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div className={`h-px w-16 sm:w-24 mx-3 transition-colors ${done ? 'bg-brand-200' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
