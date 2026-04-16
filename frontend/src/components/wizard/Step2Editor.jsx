import { useState } from 'react';
import useCVStore from '../../store/cvStore';
import CVPreviewPanel from '../preview/CVPreviewPanel';
import PersonalInfoSection from '../form/PersonalInfoSection';
import WorkExperienceSection from '../form/WorkExperienceSection';
import EducationSection from '../form/EducationSection';
import SkillsSection from '../form/SkillsSection';
import LanguagesSection from '../form/LanguagesSection';
import HobbiesSection from '../form/HobbiesSection';

const SECTIONS = [
  { id: 'personal', label: 'Persönliche Daten', icon: '👤', Component: PersonalInfoSection },
  { id: 'work', label: 'Berufserfahrung', icon: '💼', Component: WorkExperienceSection },
  { id: 'education', label: 'Ausbildung', icon: '🎓', Component: EducationSection },
  { id: 'skills', label: 'Kenntnisse', icon: '⭐', Component: SkillsSection },
  { id: 'languages', label: 'Sprachen', icon: '🌍', Component: LanguagesSection },
  { id: 'hobbies', label: 'Hobbys & Interessen', icon: '🎯', Component: HobbiesSection },
];

export default function Step2Editor({ onBack, onNext }) {
  const [activeSection, setActiveSection] = useState('personal');
  const currentCV = useCVStore(s => s.currentCV);
  const isSaving = useCVStore(s => s.isSaving);

  const active = SECTIONS.find(s => s.id === activeSection);
  const ActiveComponent = active?.Component;

  return (
    <div className="flex h-[calc(100vh-130px)] overflow-hidden">
      {/* Section sidebar */}
      <div className="w-48 shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
        <nav className="p-2 space-y-0.5">
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                activeSection === sec.id
                  ? 'bg-brand text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{sec.icon}</span>
              <span className="leading-tight">{sec.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Form panel */}
      <div className="w-80 shrink-0 bg-gray-50 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h3 className="font-semibold text-gray-800 text-sm">{active?.label}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {ActiveComponent && <ActiveComponent />}
        </div>
        {/* Navigation buttons */}
        <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
          <button onClick={onBack} className="btn-secondary flex-1 text-sm py-2">
            ← Zurück
          </button>
          <button onClick={onNext} disabled={isSaving} className="btn-primary flex-1 text-sm py-2">
            {isSaving ? 'Speichern…' : 'Weiter →'}
          </button>
        </div>
      </div>

      {/* Live Preview panel */}
      <div className="flex-1 bg-gray-200 overflow-y-auto cv-preview-scroll flex items-start justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <CVPreviewPanel cvData={currentCV} />
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">Live-Vorschau · Änderungen werden sofort angezeigt</p>
        </div>
      </div>
    </div>
  );
}
