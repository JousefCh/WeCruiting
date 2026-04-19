import { renderDescription, calcNameFontSize } from '../../../utils/templateUtils';

function Description({ text, lightColor }) {
  const lines = renderDescription(text);
  if (!lines) return null;
  return (
    <div style={{ marginTop: 4 }}>
      {lines.map(({ key, isBullet, content }) =>
        isBullet ? (
          <div key={key} data-cv-line style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
            <span style={{ color: lightColor || '#9ca3af', marginTop: 1, flexShrink: 0 }}>•</span>
            <span>{content}</span>
          </div>
        ) : (
          <p key={key} data-cv-line style={{ marginBottom: 3 }}>{content}</p>
        )
      )}
    </div>
  );
}

export default function ModernTemplate({ data, primaryColor, fontFamily, pageCount = 1, backgroundOnly = false }) {
  const { personalInfo: p = {}, workExperience = [], education = [], skills = [], languages = [], hobbies = [] } = data;

  if (backgroundOnly) {
    return (
      <div style={{ fontFamily, width: 794, minHeight: 1123 * pageCount, display: 'flex', background: '#fff' }}>
        <div style={{ width: 265, background: primaryColor }} />
      </div>
    );
  }
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Ihr Name';

  const dot = (filled) => (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: filled ? '#fff' : 'rgba(255,255,255,0.3)',
      marginRight: 3,
    }} />
  );

  const sideSection = (title, children) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );

  const mainSection = (title, children) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: primaryColor }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: primaryColor, marginLeft: 10, opacity: 0.3 }} />
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily, width: 794, minHeight: 1123 * pageCount, display: 'flex', background: '#fff', fontSize: 16, color: '#1a1a2e', position: 'relative' }}>
      {/* Sidebar */}
      <div style={{ width: 265, background: primaryColor, color: '#fff', padding: '36px 22px', display: 'flex', flexDirection: 'column' }}>
        {p.photo && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src={p.photo} alt="Foto" style={{ width: 95, height: 95, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)' }} />
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: calcNameFontSize(fullName, 26), fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>{fullName}</div>
          {workExperience[0]?.position && (
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{workExperience[0].position}</div>
          )}
        </div>

        {sideSection('Kontakt', (
          <div style={{ fontSize: 15, lineHeight: 1.9, color: 'rgba(255,255,255,0.85)' }}>
            {p.email && <div>{p.email}</div>}
            {p.phone && <div>{p.phone}</div>}
            {(p.city || p.postalCode) && <div>{[p.postalCode, p.city].filter(Boolean).join(' ')}</div>}
            {p.address && <div>{p.address}</div>}
            {p.birthDate && <div>geb. {p.birthDate}</div>}
            {p.nationality && <div>{p.nationality}</div>}
            {p.linkedin && <div style={{ wordBreak: 'break-all' }}>{p.linkedin}</div>}
          </div>
        ))}

        {skills.length > 0 && sideSection('Kenntnisse', (
          <div>
            {skills.map(s => (
              <div key={s.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>{s.name}</div>
                <div>{[1,2,3,4,5].map(i => dot(i <= s.level))}</div>
              </div>
            ))}
          </div>
        ))}

        {languages.length > 0 && sideSection('Sprachen', (
          <div style={{ fontSize: 15, lineHeight: 2, color: 'rgba(255,255,255,0.85)' }}>
            {languages.map(l => (
              <div key={l.id}><span style={{ fontWeight: 600 }}>{l.language}</span> · {l.level}</div>
            ))}
          </div>
        ))}

        {hobbies.length > 0 && sideSection('Interessen', (
          <div style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
            {hobbies.join(' · ')}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '36px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: calcNameFontSize(fullName, 49), fontWeight: 700, color: '#1a1a2e', lineHeight: 1.1, wordBreak: 'break-word' }}>{fullName}</div>
          {workExperience[0]?.position && (
            <div style={{ fontSize: 20, color: primaryColor, fontWeight: 500, marginTop: 5 }}>{workExperience[0].position}</div>
          )}
        </div>

        {p.summary && mainSection('Profil', (
          <p data-cv-item="profile" style={{ fontSize: 16, lineHeight: 1.7, color: '#374151' }}>{p.summary}</p>
        ))}

        {workExperience.length > 0 && mainSection('Berufserfahrung', (
          <div>
            {workExperience.map(job => (
              <div key={job.id} data-cv-item="work" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18 }}>{job.position}</div>
                    {job.berufsbezeichnung && <div style={{ fontSize: 15, color: '#6b7280', fontStyle: 'italic' }}>{job.berufsbezeichnung}</div>}
                    <div style={{ color: primaryColor, fontSize: 16 }}>{job.company}</div>
                  </div>
                  <div style={{ fontSize: 15, color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {job.startDate} – {job.current ? 'heute' : job.endDate}
                  </div>
                </div>
                {job.description && (
                  <div style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.65 }}>
                    <Description text={job.description} lightColor="rgba(107,114,128,0.7)" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {education.length > 0 && mainSection('Ausbildung', (
          <div>
            {education.map(edu => (
              <div key={edu.id} data-cv-item="edu" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18 }}>{edu.degree}{edu.field ? ` – ${edu.field}` : ''}</div>
                    <div style={{ color: primaryColor, fontSize: 16 }}>{edu.institution}</div>
                  </div>
                  <div style={{ fontSize: 15, color: '#6b7280', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {edu.startDate} – {edu.current ? 'heute' : edu.endDate}
                  </div>
                </div>
                {edu.grade && <div style={{ fontSize: 15, color: '#6b7280' }}>Note: {edu.grade}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', pointerEvents: 'none' }}>
        Made with WeCruiting CV Builder
      </div>
    </div>
  );
}
