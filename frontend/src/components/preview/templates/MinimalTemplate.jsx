import { renderDescription, calcNameFontSize } from '../../../utils/templateUtils';

function Description({ text }) {
  const lines = renderDescription(text);
  if (!lines) return null;
  return (
    <div style={{ marginTop: 4 }}>
      {lines.map(({ key, isBullet, content }) =>
        isBullet ? (
          <div key={key} style={{ display: 'flex', gap: 7, marginBottom: 2 }}>
            <span style={{ color: '#9ca3af', flexShrink: 0, marginTop: 1 }}>•</span>
            <span>{content}</span>
          </div>
        ) : (
          <p key={key} style={{ marginBottom: 3 }}>{content}</p>
        )
      )}
    </div>
  );
}

export default function MinimalTemplate({ data, primaryColor, fontFamily, pageCount = 1 }) {
  const { personalInfo: p = {}, workExperience = [], education = [], skills = [], languages = [], hobbies = [] } = data;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Ihr Name';

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24, display: 'flex', gap: 20 }}>
      <div style={{ width: 140, minWidth: 140, paddingTop: 2 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: primaryColor }}>{title}</span>
      </div>
      <div style={{ flex: 1, borderLeft: `2px solid ${primaryColor}`, paddingLeft: 18 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily, width: 794, minHeight: 1123 * pageCount, background: '#fff', fontSize: 12, color: '#1a1a2e', padding: '48px 48px 48px 36px', position: 'relative' }}>
      {/* Left accent bar — bottom:0 is more reliable than height:'100%' on a minHeight container */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: primaryColor }} />

      <div style={{ paddingLeft: 12 }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: calcNameFontSize(fullName, 36), fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, color: '#0a0a0a', wordBreak: 'break-word' }}>{fullName}</div>
              {workExperience[0]?.position && (
                <div style={{ fontSize: 14, color: primaryColor, fontWeight: 500, marginTop: 7 }}>{workExperience[0].position}</div>
              )}
            </div>
            {p.photo && (
              <img src={p.photo} alt="Foto" style={{ width: 82, height: 82, objectFit: 'cover', filter: 'grayscale(20%)' }} />
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginTop: 14, fontSize: 11, color: '#6b7280' }}>
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.city && <span>{[p.postalCode, p.city].filter(Boolean).join(' ')}</span>}
            {p.birthDate && <span>geb. {p.birthDate}</span>}
            {p.nationality && <span>{p.nationality}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
          </div>

          <div style={{ height: 1, background: '#f3f4f6', marginTop: 20 }} />
        </div>

        {p.summary && (
          <Section title="Profil">
            <p data-cv-item="profile" style={{ fontSize: 12, lineHeight: 1.7, color: '#374151' }}>{p.summary}</p>
          </Section>
        )}

        {workExperience.length > 0 && (
          <Section title="Berufserfahrung">
            {workExperience.map((job, idx) => (
              <div key={job.id} data-cv-item="work" style={{ marginBottom: idx < workExperience.length - 1 ? 15 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>
                    {job.startDate} – {job.current ? 'heute' : job.endDate}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{job.company}</div>
                {job.description && (
                  <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.65 }}>
                    <Description text={job.description} />
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {education.length > 0 && (
          <Section title="Ausbildung">
            {education.map((edu, idx) => (
              <div key={edu.id} data-cv-item="edu" style={{ marginBottom: idx < education.length - 1 ? 13 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{edu.degree}{edu.field ? ` – ${edu.field}` : ''}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>
                    {edu.startDate} – {edu.current ? 'heute' : edu.endDate}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{edu.institution}</div>
                {edu.grade && <div style={{ fontSize: 11, color: '#9ca3af' }}>Note: {edu.grade}</div>}
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Kenntnisse">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 22px' }}>
              {skills.map(s => (
                <div key={s.id} style={{ fontSize: 11 }}>
                  <span style={{ color: '#1a1a2e' }}>{s.name}</span>
                  {s.level > 0 && (
                    <span style={{ color: primaryColor, marginLeft: 5, fontSize: 10 }}>
                      {'▪'.repeat(s.level)}{'▫'.repeat(5 - s.level)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {languages.length > 0 && (
          <Section title="Sprachen">
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              {languages.map(l => (
                <span key={l.id} style={{ fontSize: 11 }}>
                  <strong>{l.language}</strong> <span style={{ color: '#6b7280' }}>{l.level}</span>
                </span>
              ))}
            </div>
          </Section>
        )}

        {hobbies.length > 0 && (
          <Section title="Interessen">
            <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.8 }}>{hobbies.join('  ·  ')}</div>
          </Section>
        )}
      </div>
    </div>
  );
}
