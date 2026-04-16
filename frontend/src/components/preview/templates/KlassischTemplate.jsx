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

export default function KlassischTemplate({ data, primaryColor, fontFamily, pageCount = 1 }) {
  const { personalInfo: p = {}, workExperience = [], education = [], skills = [], languages = [], hobbies = [] } = data;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Ihr Name';

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: primaryColor }}>{title}</span>
      </div>
      <div style={{ borderBottom: `2px solid ${primaryColor}`, marginBottom: 10 }} />
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily, width: 794, minHeight: 1123 * pageCount, background: '#fff', padding: '48px 52px', fontSize: 12, color: '#1a1a2e', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: calcNameFontSize(fullName, 32), fontWeight: 700, color: '#1a1a2e', letterSpacing: -0.5, wordBreak: 'break-word' }}>{fullName}</div>
          {workExperience[0]?.position && (
            <div style={{ fontSize: 14, color: primaryColor, fontWeight: 500, marginTop: 5 }}>{workExperience[0].position}</div>
          )}
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10, lineHeight: 1.9 }}>
            {p.email && <span>{p.email}{p.phone ? '  ·  ' : ''}</span>}
            {p.phone && <span>{p.phone}</span>}
            {(p.city || p.address) && <><br />{[p.address, p.postalCode, p.city].filter(Boolean).join(', ')}</>}
            {p.birthDate && <><br />geb. {p.birthDate}{p.birthPlace ? ` in ${p.birthPlace}` : ''}</>}
            {p.nationality && <><br />{p.nationality}</>}
          </div>
        </div>
        {p.photo && (
          <img src={p.photo} alt="Foto" style={{ width: 105, height: 130, objectFit: 'cover', border: `2px solid ${primaryColor}` }} />
        )}
      </div>

      {p.summary && (
        <Section title="Profil">
          <p data-cv-item="profile" style={{ fontSize: 12, lineHeight: 1.7, color: '#374151' }}>{p.summary}</p>
        </Section>
      )}

      {workExperience.length > 0 && (
        <Section title="Berufserfahrung">
          {workExperience.map(job => (
            <div key={job.id} data-cv-item="work" style={{ display: 'flex', marginBottom: 13 }}>
              <div style={{ width: 135, minWidth: 135, fontSize: 11, color: '#6b7280', paddingTop: 1, lineHeight: 1.5 }}>
                {job.startDate}<br />– {job.current ? 'heute' : job.endDate}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{job.position}</div>
                <div style={{ color: primaryColor, fontSize: 12, marginBottom: 3 }}>{job.company}</div>
                {job.description && (
                  <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.65 }}>
                    <Description text={job.description} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Ausbildung">
          {education.map(edu => (
            <div key={edu.id} data-cv-item="edu" style={{ display: 'flex', marginBottom: 12 }}>
              <div style={{ width: 135, minWidth: 135, fontSize: 11, color: '#6b7280', paddingTop: 1, lineHeight: 1.5 }}>
                {edu.startDate}<br />– {edu.current ? 'heute' : edu.endDate}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{edu.degree}{edu.field ? ` – ${edu.field}` : ''}</div>
                <div style={{ color: primaryColor, fontSize: 12, marginBottom: 2 }}>{edu.institution}</div>
                {edu.grade && <div style={{ fontSize: 11, color: '#6b7280' }}>Note: {edu.grade}</div>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {(skills.length > 0 || languages.length > 0) && (
        <div style={{ display: 'flex', gap: 24 }}>
          {skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <Section title="Kenntnisse">
                {skills.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ flex: 1, fontSize: 11 }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: i <= s.level ? primaryColor : '#e5e7eb' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          )}
          {languages.length > 0 && (
            <div style={{ flex: 1 }}>
              <Section title="Sprachkenntnisse">
                {languages.map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                    <span style={{ fontWeight: 600 }}>{l.language}</span>
                    <span style={{ color: '#6b7280' }}>{l.level}</span>
                  </div>
                ))}
              </Section>
            </div>
          )}
        </div>
      )}

      {hobbies.length > 0 && (
        <Section title="Hobbys & Interessen">
          <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.8 }}>{hobbies.join('  ·  ')}</div>
        </Section>
      )}
    </div>
  );
}
