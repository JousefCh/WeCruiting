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

export default function KreativTemplate({ data, primaryColor, fontFamily, pageCount = 1 }) {
  const { personalInfo: p = {}, workExperience = [], education = [], skills = [], languages = [], hobbies = [] } = data;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Ihr Name';

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'inline-block', background: primaryColor, color: '#fff',
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
        padding: '3px 10px', borderRadius: 2, marginBottom: 10
      }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily, width: 794, minHeight: 1123 * pageCount, background: '#fff', fontSize: 12, color: '#1a1a2e', display: 'flex', flexDirection: 'column' }}>
      {/* Header band */}
      <div style={{ background: primaryColor, padding: '32px 40px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `rgba(255,255,255,0.07)` }} />
        <div style={{ position: 'absolute', bottom: -30, right: 80, width: 100, height: 100, borderRadius: '50%', background: `rgba(255,255,255,0.05)` }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
          {p.photo && (
            <img src={p.photo} alt="Foto" style={{ width: 85, height: 85, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)' }} />
          )}
          <div>
            <div style={{ fontSize: calcNameFontSize(fullName, 28), fontWeight: 800, letterSpacing: -0.5, wordBreak: 'break-word' }}>{fullName}</div>
            {workExperience[0]?.position && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontWeight: 400 }}>{workExperience[0].position}</div>
            )}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 1.8 }}>
              {[p.email, p.phone, p.city ? `${p.postalCode ? p.postalCode + ' ' : ''}${p.city}` : ''].filter(Boolean).join('  ·  ')}
            </div>
          </div>
        </div>
      </div>

      {/* Body — flex:1 ensures it stretches to fill remaining page height */}
      <div style={{ display: 'flex', gap: 0, flex: 1 }}>
        {/* Left column */}
        <div style={{ width: 230, padding: '24px 20px', background: `rgba(${hexToRgb(primaryColor)}, 0.04)`, borderRight: `1px solid rgba(${hexToRgb(primaryColor)}, 0.1)` }}>
          {p.summary && (
            <Section title="Über mich">
              <p style={{ fontSize: 11, lineHeight: 1.7, color: '#4b5563' }}>{p.summary}</p>
            </Section>
          )}

          {skills.length > 0 && (
            <Section title="Kenntnisse">
              {skills.map(s => (
                <div key={s.id} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
                    <span>{s.name}</span>
                    <span style={{ color: primaryColor, fontWeight: 600, fontSize: 10 }}>
                      {['', 'Einsteiger', 'Grundlagen', 'Fortgeschritten', 'Experte', 'Experte'][s.level]}
                    </span>
                  </div>
                  <div style={{ background: '#e5e7eb', height: 4, borderRadius: 2 }}>
                    <div style={{ background: primaryColor, height: 4, borderRadius: 2, width: `${s.level * 20}%` }} />
                  </div>
                </div>
              ))}
            </Section>
          )}

          {languages.length > 0 && (
            <Section title="Sprachen">
              {languages.map(l => (
                <div key={l.id} style={{ marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>{l.language}</span>
                  <div style={{ color: '#6b7280', fontSize: 10 }}>{l.level}</div>
                </div>
              ))}
            </Section>
          )}

          {p.birthDate && (
            <Section title="Persönliches">
              <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.9 }}>
                {p.birthDate && <div>geb. {p.birthDate}</div>}
                {p.birthPlace && <div>in {p.birthPlace}</div>}
                {p.nationality && <div>{p.nationality}</div>}
                {p.linkedin && <div style={{ wordBreak: 'break-all' }}>{p.linkedin}</div>}
              </div>
            </Section>
          )}

          {hobbies.length > 0 && (
            <Section title="Interessen">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {hobbies.map((h, i) => (
                  <span key={i} style={{ background: `rgba(${hexToRgb(primaryColor)}, 0.1)`, color: primaryColor, fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{h}</span>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex: 1, padding: '24px 28px' }}>
          {workExperience.length > 0 && (
            <Section title="Berufserfahrung">
              {workExperience.map(job => (
                <div key={job.id} data-cv-item="work" style={{ marginBottom: 17, paddingLeft: 12, borderLeft: `3px solid ${primaryColor}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                  <div style={{ color: primaryColor, fontSize: 12, margin: '2px 0' }}>{job.company}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                    {job.startDate} – {job.current ? 'heute' : job.endDate}
                  </div>
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
              {education.map(edu => (
                <div key={edu.id} data-cv-item="edu" style={{ marginBottom: 14, paddingLeft: 12, borderLeft: `3px solid ${primaryColor}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{edu.degree}</div>
                  {edu.field && <div style={{ fontSize: 12, color: '#4b5563' }}>{edu.field}</div>}
                  <div style={{ color: primaryColor, fontSize: 12, margin: '2px 0' }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>
                    {edu.startDate} – {edu.current ? 'heute' : edu.endDate}{edu.grade ? ` · Note: ${edu.grade}` : ''}
                  </div>
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
