import useCVStore from '../../store/cvStore';
import { TEMPLATES, FONT_OPTIONS, COLOR_PRESETS } from '../preview/templates/index';
import CVPreviewPanel from '../preview/CVPreviewPanel';

export default function Step1Template({ onNext }) {
  const design = useCVStore(s => s.currentCV.design);
  const currentCV = useCVStore(s => s.currentCV);
  const updateDesign = useCVStore(s => s.updateDesign);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Vorlage und Design wählen</h2>

      {/* Template grid */}
      <div className="mb-8">
        <h3 className="section-title mb-4">Vorlage</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {TEMPLATES.map(tpl => {
            const selected = design.template === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => updateDesign('template', tpl.id)}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                  selected ? 'border-brand shadow-md shadow-brand/20' : 'border-gray-200 hover:border-brand-200'
                }`}
              >
                {/* Mini preview */}
                <div className="h-48 bg-gray-50 overflow-hidden pointer-events-none">
                  <div style={{ transform: 'scale(0.28)', transformOrigin: 'top left', width: 794 }}>
                    <tpl.component
                      data={currentCV}
                      primaryColor={design.primaryColor}
                      fontFamily={design.fontFamily}
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="p-2.5">
                  <div className="font-semibold text-sm text-gray-800">{tpl.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{tpl.description}</div>
                </div>

                {/* Selected check */}
                {selected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-brand rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color & Font */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
        {/* Color */}
        <div>
          <h3 className="section-title mb-3">Primärfarbe</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {COLOR_PRESETS.map(color => (
              <button
                key={color}
                onClick={() => updateDesign('primaryColor', color)}
                title={color}
                style={{ backgroundColor: color }}
                className={`w-9 h-9 rounded-full border-2 transition-all ${
                  design.primaryColor === color ? 'border-gray-800 scale-110' : 'border-transparent'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={design.primaryColor}
              onChange={e => updateDesign('primaryColor', e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
              title="Eigene Farbe wählen"
            />
            <span className="text-sm text-gray-500">Eigene Farbe: <span className="font-mono text-gray-700">{design.primaryColor}</span></span>
          </div>
        </div>

        {/* Font */}
        <div>
          <h3 className="section-title mb-3">Schriftart</h3>
          <div className="space-y-2">
            {FONT_OPTIONS.map(font => (
              <button
                key={font.id}
                onClick={() => updateDesign('fontFamily', font.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all text-sm ${
                  design.fontFamily === font.id
                    ? 'border-brand bg-brand-50 text-brand font-semibold'
                    : 'border-gray-200 hover:border-brand-200 text-gray-700'
                }`}
                style={{ fontFamily: font.id }}
              >
                {font.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onNext} className="btn-primary px-8 py-3 text-base">
          Weiter: Daten eingeben →
        </button>
      </div>
    </div>
  );
}
