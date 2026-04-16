import { renderDescription, calcNameFontSize } from '../../../utils/templateUtils';

function Description({ text, fontFamily }) {
  const lines = renderDescription(text);
  if (!lines) return null;
  return (
    <div style={{ marginTop: 4, fontFamily }}>
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

export default function ElegantTemplate({ data, primaryColor, fontFamily, pageCount = 1 }) {
  const { personalInfo: p = {}, workExperience = [], education = [], skills = [], languages = [], hobbies = [] } = data;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Ihr Name';
  const serifFont = `'EB Garamond', 'Playfair Display', Georgia, serif`;

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 28, height: 1, background: primaryColor }} />
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: primaryColor, fontFamily }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: serifFont, width: 794, minHeight: 1123 * pageCount, background: '#fdfcf9', fontSize: 12, color: '#2d2d2d', padding: '52px 56px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${primaryColor}`, position: 'relative' }}>
        {p.photo && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img src={p.photo} alt="Foto" style={{ width: 95, height: 95, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${primaryColor}`, padding: 3, boxShadow: `0 0 0 1px ${primaryColor}` }} />
          </div>
        )}
        <div style={{ fontSize: calcNameFontSize(fullName, 34), fontWeight: 600, letterSpacing: 1, fontFamily: serifFont, color: '#1a1a2e', wordBreak: 'break-word' }}>{fullName}</div>
        {workExperience[0]?.position && (
          <div style={{ fontSize: 13, color: primaryColor, marginTop: 6, fontFamily, letterSpacing: 0.5, fontWeight: 400 }}>{workExperience[0].position}</div>
        )}
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10, lineHeight: 1.9, fontFamily }}>
          {[p.email, p.phone, p.city ? `${p.postalCode ? p.postalCode + ' ' : ''}${p.city}` : ''].filter(Boolean).join('  ·  ')}
        </div>
        {(p.linkedin || p.website) && (
          <div style={{ fontSize: 11, color: '#6b7280', fontFamily }}>
            {[p.linkedin, p.website].filter(Boolean).join('  ·  ')}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#fdfcf9', padding: '0 12px' }}>
          <span style={{ color: primaryColor, fontSize: 16 }}>❧</span>
        </div>
      </div>

      {p.summary && (
        <Section title="Profil">
          <p data-cv-item="profile" style={{ fontSize: 12, lineHeight: 1.8, color: '#374151', textAlign: 'justify', fontStyle: 'italic' }}>{p.summary}</p>
        </Section>
      )}

      {workExperience.length > 0 && (
        <Section title="Berufliche Laufbahn">
          {workExperience.map(job => (
            <div key={job.id} data-cv-item="work" style={{ display: 'flex', marginBottom: 15 }}>
              <div style={{ width: 125, minWidth: 125, fontSize: 11, color: '#9ca3af', fontFamily, paddingTop: 2 }}>
                {job.startDate}<br />– {job.current ? 'heute' : job.endDate}
              </div>
              <div style={{ flex: 1, paddingLeft: 16, borderLeft: `1px solid #e5e7eb` }}>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: serifFont }}>{job.position}</div>
                <div style={{ color: primaryColor, fontSize: 12, fontFamily, marginBottom: 3 }}>{job.company}</div>
                {job.description && (
                  <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.7 }}>
                    <Description text={job.description} fontFamily={fontFamily} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Bildungsweg">
          {education.map(edu => (
            <div key={edu.id} data-cv-item="edu" style={{ display: 'flex', marginBottom: 13 }}>
              <div style={{ width: 125, minWidth: 125, fontSize: 11, color: '#9ca3af', fontFamily, paddingTop: 2 }}>
                {edu.startDate}<br />– {edu.current ? 'heute' : edu.endDate}
              </div>
              <div style={{ flex: 1, paddingLeft: 16, borderLeft: `1px solid #e5e7eb` }}>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: serifFont }}>{edu.degree}{edu.field ? ` – ${edu.field}` : ''}</div>
                <div style={{ color: primaryColor, fontSize: 12, fontFamily }}>{edu.institution}</div>
                {edu.grade && <div style={{ fontSize: 11, color: '#9ca3af', fontFamily }}>Abschlussnote: {edu.grade}</div>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {(skills.length > 0 || languages.length > 0 || hobbies.length > 0) && (
        <div style={{ display: 'flex', gap: 28 }}>
          {skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <Section title="Kompetenzen">
                {skills.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 7, gap: 10 }}>
                    <span style={{ flex: 1, fontSize: 11, fontFamily }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i <= s.level ? primaryColor : '#e5e7eb', border: `1px solid ${i <= s.level ? primaryColor : '#d1d5db'}` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          )}
          {languages.length > 0 && (
            <div style={{ flex: 1 }}>
              <Section title="Sprachen">
                {languages.map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 11, fontFamily }}>
                    <span style={{ fontWeight: 600 }}>{l.language}</span>
                    <span style={{ color: '#6b7280', fontStyle: 'italic' }}>{l.level}</span>
                  </div>
                ))}
              </Section>
            </div>
          )}
          {hobbies.length > 0 && (
            <div style={{ flex: 1 }}>
              <Section title="Interessen">
                <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.9, fontFamily }}>{hobbies.join('  ·  ')}</div>
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
