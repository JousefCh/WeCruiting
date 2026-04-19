import useCVStore from '../../store/cvStore';
import PhotoUpload from './PhotoUpload';

// Defined outside the component so React doesn't recreate it on every render
function Field({ label, field, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input-field"
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange(field, e.target.value)}
      />
    </div>
  );
}

export default function PersonalInfoSection() {
  const personalInfo = useCVStore(s => s.currentCV.personalInfo);
  const updatePersonalInfo = useCVStore(s => s.updatePersonalInfo);

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Bewerbungsfoto</label>
        <PhotoUpload
          photo={personalInfo.photo}
          onPhotoChange={val => updatePersonalInfo('photo', val)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Vorname" field="firstName" placeholder="Max" value={personalInfo.firstName} onChange={updatePersonalInfo} />
        <Field label="Nachname" field="lastName" placeholder="Mustermann" value={personalInfo.lastName} onChange={updatePersonalInfo} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Geburtsdatum" field="birthDate" placeholder="01.01.1990" value={personalInfo.birthDate} onChange={updatePersonalInfo} />
        <Field label="Geburtsort" field="birthPlace" placeholder="Berlin" value={personalInfo.birthPlace} onChange={updatePersonalInfo} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="E-Mail" field="email" type="email" placeholder="max@beispiel.de" value={personalInfo.email} onChange={updatePersonalInfo} />
        <Field label="Telefon" field="phone" placeholder="+49 123 4567890" value={personalInfo.phone} onChange={updatePersonalInfo} />
      </div>

      <Field label="Straße & Hausnummer" field="address" placeholder="Musterstraße 1" value={personalInfo.address} onChange={updatePersonalInfo} />

      <div className="grid grid-cols-3 gap-3">
        <Field label="PLZ" field="postalCode" placeholder="12345" value={personalInfo.postalCode} onChange={updatePersonalInfo} />
        <div className="col-span-2">
          <Field label="Stadt" field="city" placeholder="Berlin" value={personalInfo.city} onChange={updatePersonalInfo} />
        </div>
      </div>

      <Field label="LinkedIn-Profil" field="linkedin" placeholder="linkedin.com/in/..." value={personalInfo.linkedin} onChange={updatePersonalInfo} />

      <div>
        <label className="label">Profil / Kurzvorstellung</label>
        <textarea
          className="input-field resize-none"
          rows={4}
          placeholder="Kurze Beschreibung Ihrer beruflichen Stärken und Ziele…"
          value={personalInfo.summary || ''}
          onChange={e => updatePersonalInfo('summary', e.target.value)}
        />
      </div>
    </div>
  );
}
