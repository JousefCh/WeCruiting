import { useState, useEffect } from 'react';
import api from '../../services/api';
import { exportCVToPDFBlob } from '../../utils/pdfExport';
import RichEmailEditor from '../editor/RichEmailEditor';

// ── Step indicators ────────────────────────────────────────────────────────────

const STEPS = ['Suche', 'Unternehmen', 'E-Mail-Adressen', 'Versenden'];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, idx) => {
        const num = idx + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${done ? 'bg-brand text-white' : active ? 'bg-brand text-white ring-4 ring-brand/20' : 'bg-gray-200 text-gray-500'}`}>
                {done ? '✓' : num}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-brand font-semibold' : 'text-gray-400'}`}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-brand' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Suchparameter ──────────────────────────────────────────────────────

function Step1Search({ params, onChange, onSearch, loading, analyzing, error, candidateProfile }) {
  return (
    <div className="space-y-4">
      {analyzing ? (
        <div className="flex items-center gap-2 text-sm text-brand bg-brand-50 rounded-lg px-3 py-2">
          <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
          Analysiere Kandidatenprofil und Firmenwebsite…
        </div>
      ) : candidateProfile?.candidateSummary ? (
        <div className="bg-brand-50 border border-brand/20 rounded-xl p-4 space-y-2.5">
          <p className="text-xs font-semibold text-brand uppercase tracking-wide">KI-Analyse Kandidatenprofil</p>
          <p className="text-sm text-gray-800 leading-relaxed">{candidateProfile.candidateSummary}</p>
          {candidateProfile.targetCompanyTypes?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Zielunternehmen — klicken zum Übernehmen:</p>
              <div className="flex flex-wrap gap-1.5">
                {candidateProfile.targetCompanyTypes.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ ...params, companyType: t })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      params.companyType === t
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-brand hover:text-brand'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Felder wurden anhand der Firmenwebsite des Arbeitgebers vorbelegt. Bitte prüfen und ggf. anpassen.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Branche / Tätigkeit</label>
          <input className="input-field" placeholder="z.B. Elektrotechnik" value={params.industry}
            onChange={e => onChange({ ...params, industry: e.target.value })} />
        </div>
        <div>
          <label className="label">Unternehmenstyp</label>
          <input className="input-field" placeholder="z.B. ausführendes Unternehmen" value={params.companyType}
            onChange={e => onChange({ ...params, companyType: e.target.value })} />
        </div>
        <div>
          <label className="label">Standort (Wohnort des Kandidaten)</label>
          <input className="input-field" placeholder="z.B. Stuttgart" value={params.location}
            onChange={e => onChange({ ...params, location: e.target.value })} />
        </div>
        <div>
          <label className="label">Weitere Keywords (optional)</label>
          <input className="input-field" placeholder="z.B. Brücken Stahl" value={params.keywords}
            onChange={e => onChange({ ...params, keywords: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Suchradius um den Wohnort</label>
          <div className="flex gap-2">
            {[50, 80, 150].map(km => (
              <button
                key={km}
                type="button"
                onClick={() => onChange({ ...params, radius: km })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  params.radius === km
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand hover:text-brand'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button onClick={onSearch} disabled={loading || !params.industry || !params.location}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Suche läuft…</>
          : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>Unternehmen suchen</>
        }
      </button>
    </div>
  );
}

// ── Step 2: Unternehmen ────────────────────────────────────────────────────────

function Step2Companies({ companies, setCompanies, onNext, onBack, loading, error }) {
  const [customInput, setCustomInput] = useState('');

  const toggleAll = (val) => setCompanies(companies.map(c => ({ ...c, selected: val })));
  const selected = companies.filter(c => c.selected).length;

  const addCustom = () => {
    const raw = customInput.trim().replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    if (!raw || companies.some(c => c.domain === raw)) return;
    setCompanies([...companies, { name: raw, domain: raw, website: `https://${raw}`, description: 'Manuell hinzugefügt', source: 'manual', selected: true }]);
    setCustomInput('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{companies.length} Unternehmen gefunden · <span className="font-medium text-brand">{selected} ausgewählt</span></p>
        <div className="flex gap-2 text-xs">
          <button onClick={() => toggleAll(true)} className="text-brand hover:underline">Alle</button>
          <span className="text-gray-300">|</span>
          <button onClick={() => toggleAll(false)} className="text-gray-500 hover:underline">Keine</button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {companies.map((c, idx) => (
          <label key={c.domain} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
            ${c.selected ? 'border-brand bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-brand shrink-0"
              checked={c.selected} onChange={e => {
                const next = [...companies];
                next[idx] = { ...c, selected: e.target.checked };
                setCompanies(next);
              }} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
              <p className="text-xs text-brand truncate">{c.domain}</p>
              {c.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{c.description}</p>}
            </div>
          </label>
        ))}
      </div>

      {/* Manual add */}
      <div className="flex gap-2 pt-1">
        <input className="input-field flex-1 text-sm" placeholder="Domain manuell hinzufügen (z.B. firma.de)"
          value={customInput} onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()} />
        <button onClick={addCustom} className="btn-secondary px-3 py-2 text-sm shrink-0">+ Hinzufügen</button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="btn-secondary flex-1 py-2.5 text-sm">← Zurück</button>
        <button onClick={onNext} disabled={loading || selected === 0}
          className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Suche E-Mails…</>
            : `E-Mail-Adressen suchen →`
          }
        </button>
      </div>
    </div>
  );
}

// ── Step 3: E-Mail-Adressen ────────────────────────────────────────────────────

const TYPE_LABELS = {
  personal: { label: 'Persönlich', color: 'bg-blue-100 text-blue-700' },
  generic:  { label: 'Allgemein',  color: 'bg-gray-100 text-gray-600' },
};

const ROLE_PRIORITY = [
  { key: 'gf',   label: 'Geschäftsführung', match: /geschäftsführ|ceo|inhaber|owner|managing.dir/i },
  { key: 'nl',   label: 'Niederlassung',    match: /niederlassung|branch|regional|standort/i },
  { key: 'hr',   label: 'Personal / HR',    match: /personal|hr\b|human.res|recruiting|talent/i },
  { key: 'gen',  label: 'Allgemein',        match: /^(info|kontakt|bewerbung|karriere|jobs)/i },
];

function roleBadge(email) {
  for (const r of ROLE_PRIORITY) {
    if (r.match.test(email.position || '') || r.match.test(email.email)) {
      return r.label;
    }
  }
  return null;
}

function Step3Emails({ emailResults, setEmailResults, onNext, onBack }) {
  const totalSelected = emailResults.reduce((n, r) => n + r.emails.filter(e => e.selected).length, 0);

  const toggleEmail = (rIdx, eIdx, val) => {
    const next = emailResults.map((r, ri) => ri !== rIdx ? r : {
      ...r,
      emails: r.emails.map((e, ei) => ei !== eIdx ? e : { ...e, selected: val }),
    });
    setEmailResults(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Wähle die Empfänger aus. Vorausgewählt: Geschäftsführung, HR und allgemeine Adressen.
        <span className="ml-2 font-medium text-brand">{totalSelected} ausgewählt</span>
      </p>

      <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
        {emailResults.map((company, rIdx) => (
          <div key={company.domain} className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">{company.name}</p>
              <span className="text-xs text-gray-400">{company.domain}</span>
            </div>
            {company.emails.length === 0
              ? <p className="text-xs text-gray-400 italic">Keine E-Mail-Adressen gefunden.</p>
              : company.emails.map((email, eIdx) => {
                  const badge = roleBadge(email);
                  const typeInfo = TYPE_LABELS[email.type] || TYPE_LABELS.personal;
                  return (
                    <label key={email.email} className={`flex items-center gap-3 py-1.5 px-2 rounded-lg cursor-pointer transition-colors
                      ${email.selected ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" className="w-4 h-4 accent-brand shrink-0"
                        checked={!!email.selected} onChange={e => toggleEmail(rIdx, eIdx, e.target.checked)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-800">{email.email}</span>
                          {badge && <span className="text-xs bg-brand-100 text-brand px-1.5 py-0.5 rounded-full">{badge}</span>}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                        </div>
                        {(email.firstName || email.position) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[email.firstName, email.lastName].filter(Boolean).join(' ')}
                            {email.position && ` · ${email.position}`}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-300 shrink-0">{email.confidence > 0 ? `${email.confidence}%` : email.source}</span>
                    </label>
                  );
                })
            }
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="btn-secondary flex-1 py-2.5 text-sm">← Zurück</button>
        <button onClick={onNext} disabled={totalSelected === 0}
          className="btn-primary flex-1 py-2.5 text-sm">
          Vorschau & Versenden →
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Kampagne erstellen & starten ──────────────────────────────────────

function EmailExpandModal({ subject, body, onSubjectChange, onBodyChange, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-800">E-Mail bearbeiten</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="label">Betreff</label>
            <input
              className="input-field text-sm"
              value={subject}
              onChange={e => onSubjectChange(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">E-Mail-Text</label>
            <RichEmailEditor content={body} onChange={onBodyChange} minHeight={360} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="btn-primary w-full py-2.5 text-sm">
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}

function Step4Send({ emailResults, subject, body, setSubject, setBody, profileDisplayName, emailGenerating, onBack, onCreateCampaign, sending, sendResult }) {
  const [emailExpanded, setEmailExpanded] = useState(false);
  const recipients = emailResults.flatMap(r => r.emails.filter(e => e.selected).map(e => ({ ...e, company: r.name })));

  if (sendResult) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-800">{sendResult.message}</p>
          {sendResult.campaignName && (
            <p className="text-sm text-gray-500 mt-1">{sendResult.campaignName}</p>
          )}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 text-left space-y-1">
          <p className="font-medium">Bitte in Instantly prüfen &amp; freigeben:</p>
          <p>· Kampagne liegt als Entwurf in Instantly vor</p>
          <p>· Erst-Mail mit AGB + Profil-PDF als Anhang</p>
          <p>· Follow-up 1 nach 3 Tagen · Follow-up 2 nach weiteren 5 Tagen</p>
          <p>· Automatischer Stopp bei Antwort</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campaign preview */}
      <div className="bg-brand-50 border border-brand/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-xs font-semibold text-brand">Neue Instantly-Kampagne wird erstellt</p>
        </div>
        <p className="text-sm font-medium text-gray-800">WeCruiting – {profileDisplayName}</p>
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>Anhänge: AGB_WeCruiting.pdf · {profileDisplayName}.pdf</p>
          <p>Follow-ups: Tag 3 · Tag 8 · Stopp bei Antwort</p>
        </div>
      </div>

      {/* Editable email */}
      <div className="space-y-2">
        <div>
          <label className="label">Betreff (Erst-Mail)</label>
          <div className="relative">
            <input className="input-field text-sm" value={subject} onChange={e => setSubject(e.target.value)} disabled={emailGenerating} />
            {emailGenerating && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">E-Mail-Text (Erst-Mail)</label>
            <button
              type="button"
              onClick={() => setEmailExpanded(true)}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors"
              title="Vollbild bearbeiten"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
              Vergrößern
            </button>
          </div>
          <div className="relative">
            <div
              className="input-field text-xs overflow-y-auto max-h-36 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_b]:font-bold [&_strong]:font-bold [&_u]:underline [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: emailGenerating ? '<p class="text-gray-400">E-Mail wird generiert…</p>' : body }}
            />
            {emailGenerating && <div className="absolute right-3 top-3 w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>
      </div>

      {emailExpanded && (
        <EmailExpandModal
          subject={subject}
          body={body}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
          onClose={() => setEmailExpanded(false)}
        />
      )}

      {/* Recipients */}
      <div>
        <p className="label">{recipients.length} Empfänger</p>
        <div className="max-h-32 overflow-y-auto space-y-1 bg-gray-50 rounded-lg p-2">
          {recipients.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5 px-1">
              <span className="text-gray-700">{r.email}</span>
              <span className="text-gray-400">{r.company}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onBack} className="btn-secondary flex-1 py-2.5 text-sm" disabled={sending}>← Zurück</button>
        <button
          onClick={() => onCreateCampaign(recipients)}
          disabled={sending || !subject || !body}
          className="flex-1 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Kampagne wird erstellt…</>
            : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Kampagne in Instantly erstellen</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Derive initial search params from CV data ──────────────────────────────────

function deriveParams(anonEditData) {
  const jobs = anonEditData?.workExperience || [];
  const recent = jobs[0] || {};
  const position = recent.position || recent.berufsbezeichnung || '';
  const companyType = recent.company || '';
  const city = anonEditData?.personalInfo?.city || '';
  const country = anonEditData?.personalInfo?.country || '';
  const location = city || country || '';

  const industry = position
    .replace(/senior|junior|lead|head of|manager|leiter|leitung|direktor|projektleiter|bauleiter/gi, '')
    .trim();

  return { industry, location, companyType, keywords: '', radius: 50 };
}

// ── Build candidate context for API ───────────────────────────────────────────

function calcYearsExp(jobs) {
  if (!jobs?.length) return null;
  let earliest = new Date().getFullYear();
  for (const j of jobs) {
    const raw = j.startDate || j.von || '';
    const year = parseInt(raw.replace(/.*(\d{4}).*/, '$1'), 10);
    if (!isNaN(year) && year < earliest) earliest = year;
  }
  const years = new Date().getFullYear() - earliest;
  return years > 0 && years < 60 ? years : null;
}

function buildCandidateContext(originalCV, anonEditData) {
  const jobs = originalCV?.workExperience || anonEditData?.workExperience || [];
  const positions = jobs
    .map(j => ({ position: j.position || j.berufsbezeichnung || '', company: j.company || '' }))
    .filter(p => p.position);

  const rawSkills = anonEditData?.skills || originalCV?.skills || [];
  const skills = rawSkills
    .flatMap(s => s.items?.map(i => i.name || i) || (s.name ? [s.name] : []))
    .filter(Boolean)
    .slice(0, 15);

  return { positions, skills, yearsExp: calcYearsExp(jobs) };
}

// ── Auto-select high-priority emails ──────────────────────────────────────────

function autoSelectEmails(results) {
  return results.map(r => ({
    ...r,
    emails: r.emails.map(e => {
      const pos = (e.position || '').toLowerCase();
      const addr = e.email.toLowerCase();
      const highPriority =
        /geschäftsführ|ceo|inhaber|niederlassung|branch|hr\b|human.res|recruiting|personal/.test(pos) ||
        /^(info|bewerbung|karriere|jobs|hr|recruiting|kontakt)@/.test(addr);
      return { ...e, selected: highPriority || e.type === 'generic' };
    }),
  }));
}

// ── Main wizard ────────────────────────────────────────────────────────────────

// Convert backend body (\n-separated, may have inline <b>/<u> tags) to HTML for Tiptap
function bodyToHtml(text) {
  if (!text) return '';
  if (text.trimStart().startsWith('<p>')) return text; // already HTML
  return text
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => `<p>${line.trim() || '<br>'}</p>`)
    .join('');
}

export default function PlacementWizard({ anonEditData, originalCV, cachedAnalysis, onAnalysisDone, emailSubject, emailBody, profileDisplayName, anonExportId, cvId, gehaltsvorstellung, kuendigungsfrist, nearestCity, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(cachedAnalysis || null);

  const [params, setParams] = useState(() => {
    const base = deriveParams(anonEditData);
    if (cachedAnalysis) {
      return {
        ...base,
        industry: cachedAnalysis.industry || base.industry,
        companyType: cachedAnalysis.companyType || base.companyType,
        keywords: (cachedAnalysis.searchTerms || []).slice(0, 3).join(' '),
      };
    }
    return base;
  });

  // On mount: analyse only if no cached result yet
  useEffect(() => {
    if (cachedAnalysis) return;

    const jobs = originalCV?.workExperience || anonEditData?.workExperience || [];
    const recent = jobs[0] || {};
    const companyHint = recent.company || '';
    const position = recent.position || recent.berufsbezeichnung || '';
    if (!companyHint && !position) return;

    const candidateContext = buildCandidateContext(originalCV, anonEditData);

    setAnalyzing(true);
    api.post('/placement/analyze-company', { companyName: companyHint, position, candidateContext })
      .then(({ data }) => {
        onAnalysisDone?.(data);
        setCandidateProfile(data);
        setParams(prev => ({
          ...prev,
          industry: data.industry || prev.industry,
          companyType: data.companyType || prev.companyType,
          keywords: (data.searchTerms || []).slice(0, 3).join(' '),
        }));
      })
      .catch(() => { /* non-fatal — keep derived fallback */ })
      .finally(() => setAnalyzing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [companies, setCompanies] = useState([]);
  const [emailResults, setEmailResults] = useState([]);
  const [subject, setSubject] = useState(emailSubject || '');
  const [body, setBody] = useState(() => bodyToHtml(emailBody));
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Auto-generate anon email on mount if not yet available
  useEffect(() => {
    if (subject && body) return;
    if (!cvId) return;
    setEmailGenerating(true);
    api.post(`/cvs/${cvId}/generate-email`, {
      gehaltsvorstellung: gehaltsvorstellung || 'k.A.',
      kuendigungsfrist: kuendigungsfrist || 'k.A.',
      anon: true,
      nearestCity: nearestCity || '',
    })
      .then(({ data }) => {
        if (data.subject) setSubject(data.subject);
        if (data.body) setBody(bodyToHtml(data.body));
      })
      .catch(() => {})
      .finally(() => setEmailGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 1 → 2: search companies ──────────────────────────────────────────────
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/placement/search-companies', params);
      setCompanies(data.companies.map(c => ({ ...c, selected: true })));
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → 3: find emails ────────────────────────────────────────────────────
  const handleFindEmails = async () => {
    const selected = companies.filter(c => c.selected);
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/placement/find-emails', {
        domains: selected.map(c => ({ name: c.name, domain: c.domain })),
      });
      setEmailResults(autoSelectEmails(data.results));
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: create Instantly campaign ────────────────────────────────────────
  const handleCreateCampaign = async (recipients) => {
    setSending(true);
    try {
      let pdfBase64 = null;
      try {
        const blob = await exportCVToPDFBlob(anonExportId, profileDisplayName);
        const buf = await blob.arrayBuffer();
        pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      } catch (e) {
        console.warn('[Placement] PDF export failed:', e.message);
      }

      const { data } = await api.post('/placement/instantly/create-campaign', {
        candidateName: profileDisplayName,
        subject,
        body,
        pdfBase64,
        pdfFilename: `${profileDisplayName}.pdf`,
        recipients,
      });
      setSendResult(data);
    } catch (err) {
      setSendResult({ message: err.response?.data?.error || err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Profil automatisch platzieren</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <StepBar current={step} />
          {step === 1 && <Step1Search params={params} onChange={setParams} onSearch={handleSearch} loading={loading} analyzing={analyzing} error={error} candidateProfile={candidateProfile} />}
          {step === 2 && <Step2Companies companies={companies} setCompanies={setCompanies} onNext={handleFindEmails} onBack={() => setStep(1)} loading={loading} error={error} />}
          {step === 3 && <Step3Emails emailResults={emailResults} setEmailResults={setEmailResults} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && (
            <Step4Send
              emailResults={emailResults}
              subject={subject} body={body}
              setSubject={setSubject} setBody={setBody}
              profileDisplayName={profileDisplayName}
              emailGenerating={emailGenerating}
              onBack={() => setStep(3)}
              onCreateCampaign={handleCreateCampaign}
              sending={sending}
              sendResult={sendResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}
