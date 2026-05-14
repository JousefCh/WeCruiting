const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../database/db');
const closeService = require('../services/closeService');

function formatProfileNumber(num) {
  return `WeCruiting ACV${num}`;
}

exports.getProfileNumber = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, profile_number FROM cvs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

    let { profile_number } = rows[0];

    if (!profile_number) {
      const { rows: maxRows } = await pool.query('SELECT MAX(profile_number) AS max_num FROM cvs');
      const nextNum = Math.max((parseInt(maxRows[0].max_num) || 0) + 1, 18001);
      const { rows: updated } = await pool.query(
        'UPDATE cvs SET profile_number = $1 WHERE id = $2 RETURNING profile_number',
        [nextNum, req.params.id]
      );
      profile_number = updated[0].profile_number;
    }

    res.json({ profileNumber: profile_number, displayName: formatProfileNumber(profile_number) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Profilnummer.' });
  }
};

exports.sendToClose = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cvs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

    const cv = rows[0];
    const cvData = JSON.parse(cv.cv_data);
    const { pdfBase64, filename } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'Kein PDF übermittelt.' });

    const { firstName, lastName, email } = cvData.personalInfo || {};
    const lead = await closeService.searchLead(firstName, lastName, email);

    if (!lead) {
      const searched = [firstName, lastName, email].filter(Boolean).join(' / ');
      return res.status(404).json({
        error: `Kein Lead für "${searched}" in Close CRM gefunden.`,
      });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const pdfFilename = filename || `${formatProfileNumber(cv.profile_number)}.pdf`;
    await closeService.attachFileToLead(lead.id, pdfBuffer, pdfFilename);

    await pool.query('UPDATE cvs SET close_lead_id = $1 WHERE id = $2', [lead.id, cv.id]);

    const leadName = lead.display_name || `${firstName || ''} ${lastName || ''}`.trim();
    res.json({ success: true, leadName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Fehler beim Senden an Close CRM.' });
  }
};

exports.refineEmail = async (req, res) => {
  const { subject, body, instruction } = req.body;
  if (!subject || !body || !instruction) {
    return res.status(400).json({ error: 'subject, body und instruction sind erforderlich.' });
  }
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1800,
      messages: [{
        role: 'user',
        content: `Du bist ein Personalvermittler bei WeCruiting Consulting GmbH. Passe die folgende Kandidaten-Vorstellungs-E-Mail gemäß der Anweisung an.

Der E-Mail-Text kann HTML-Tags enthalten (<b>, <strong>, <em>, <u>, <p>, <br>, <ul>, <li>). Behalte alle vorhandenen HTML-Tags bei und nutze <b>text</b> für neue Hervorhebungen.

Aktuelle E-Mail:
BETREFF: ${subject}
---
${body}

Anweisung: ${instruction}

Gib NUR BETREFF und E-Mail-Text aus, getrennt durch "---". Keine Erklärungen, kein Kommentar.
Format:
BETREFF: [Betreff]
---
[E-Mail-Text mit HTML-Tags]`,
      }],
    });

    const raw = message.content[0].text.trim();
    const sepIdx = raw.indexOf('\n---');
    let newSubject = subject;
    let newBody = body;

    if (sepIdx !== -1) {
      newSubject = raw.substring(0, sepIdx).replace(/^BETREFF:\s*/i, '').trim();
      newBody = raw.substring(sepIdx + 4).trim();
    } else if (raw.startsWith('BETREFF:')) {
      const lines = raw.split('\n');
      newSubject = lines[0].replace(/^BETREFF:\s*/i, '').trim();
      newBody = lines.slice(1).join('\n').trim();
    }

    res.json({ subject: newSubject, body: newBody });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'E-Mail-Anpassung fehlgeschlagen.' });
  }
};

exports.generateEmail = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cvs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

    const cvData = JSON.parse(rows[0].cv_data);
    const {
      gehaltsvorstellung = 'k.A.',
      kuendigungsfrist = 'k.A.',
      anon = false,
      nearestCity,
    } = req.body;

    // "Darmstadt / Frankfurt / Mannheim" → "Darmstadt/Frankfurt/Mannheim"
    const cityRegion = nearestCity
      ? nearestCity.split('/').map(c => c.trim()).filter(Boolean).join('/')
      : null;
    const { personalInfo: p = {}, workExperience: cvWork = [], education: cvEdu = [], skills = [], languages = [] } = cvData;

    let fullName, standort, workExperience, education;

    if (anon) {
      let profileNumber = rows[0].profile_number;
      if (!profileNumber) {
        const { rows: maxRows } = await pool.query('SELECT MAX(profile_number) AS max_num FROM cvs');
        const nextNum = Math.max((parseInt(maxRows[0].max_num) || 0) + 1, 18001);
        await pool.query('UPDATE cvs SET profile_number = $1 WHERE id = $2', [nextNum, req.params.id]);
        profileNumber = nextNum;
      }
      fullName = formatProfileNumber(profileNumber);
      standort = nearestCity || [p.city, p.country].filter(Boolean).join(', ');
      workExperience = cvWork;
      education = cvEdu;
    } else {
      fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
      standort = cityRegion || [p.city, p.country].filter(Boolean).join(', ');
      workExperience = cvWork;
      education = cvEdu;
    }

    const currentYear = new Date().getFullYear();
    let totalYears = 0;
    workExperience.forEach(job => {
      const start = parseInt(job.startDate);
      const end = job.current ? currentYear : parseInt(job.endDate);
      if (!isNaN(start) && !isNaN(end) && end >= start) totalYears += end - start;
    });

    const cvSummary = anon
      ? `
Standort: ${standort}
Berufserfahrung gesamt: ca. ${totalYears} Jahre
Stellen (NUR Positionsbezeichnungen, KEINE Firmennamen):
${workExperience.map(j => `- ${[j.position, j.berufsbezeichnung].filter(Boolean).join(' / ')} (${j.startDate}–${j.current ? 'heute' : j.endDate})`).join('\n')}
Ausbildung:
${education.map(e => `- ${[e.degree, e.field].filter(Boolean).join(' ')} – ${e.institution}`).join('\n')}
Kenntnisse: ${skills.map(s => s.name).join(', ')}
Sprachen: ${languages.map(l => `${l.language} (${l.level})`).join(', ')}
Gehaltsvorstellung: ${gehaltsvorstellung}
Kündigungsfrist: ${kuendigungsfrist}
      `.trim()
      : `
Name: ${fullName}
Standort: ${standort}
Berufserfahrung gesamt: ca. ${totalYears} Jahre
Stellen:
${workExperience.map(j => `- ${[j.position, j.berufsbezeichnung].filter(Boolean).join(' / ')} bei ${j.company} (${j.startDate}–${j.current ? 'heute' : j.endDate})${j.description ? '\n  ' + j.description : ''}`).join('\n')}
Ausbildung:
${education.map(e => `- ${[e.degree, e.field].filter(Boolean).join(' ')} – ${e.institution}${e.description ? ' | ' + e.description : ''}`).join('\n')}
Kenntnisse: ${skills.map(s => s.name).join(', ')}
Sprachen: ${languages.map(l => `${l.language} (${l.level})`).join(', ')}
Gehaltsvorstellung: ${gehaltsvorstellung}
Kündigungsfrist: ${kuendigungsfrist}
      `.trim();

    const emailPrompt = anon
      ? `Du bist ein Personalvermittler bei WeCruiting Consulting GmbH. Erstelle eine professionelle anonyme Kandidaten-Vorstellungs-E-Mail auf Deutsch.

ANONYMISIERUNGSREGELN – strikt einhalten:
- Im Betreff steht KEIN Name und KEIN Profilkennzeichen – nur Position und Standort
  FALSCH: "Max Mustermann - Top Profil: ..."
  FALSCH: "WeCruiting ACV18001 - Top Profil: ..."
  RICHTIG: "Top Profil: Projektleiter Hochbau Standort München"
- Im gesamten E-Mail-Text (Betreff UND Body): KEINE Firmennamen, weder echte noch erkennbare
  FALSCH: "bei Siemens", "bei einem Bauunternehmen namens XY", "Hochtief", "STRABAG"
  RICHTIG: "in einem Bauunternehmen", "in einem Planungsbüro", "bei einem Industriekonzern"
- KEINE konkreten Projektnamen, keine Auftraggeber

Kandidatendaten:
${cvSummary}

Struktur der E-Mail (exakt einhalten):
BETREFF: Top Profil: [Hauptposition mit Spezialisierung] Standort ${cityRegion || standort}
---
Sehr geehrte Damen und Herren,

anbei finden Sie das Profil eines sehr interessanten <b>[Beschreibung der Position mit Spezialisierung und Standort]</b>

<b>Profildaten:</b>

<b>Berufserfahrung: [X Jahre]</b>

<b>Ausbildung:</b>
• [Abschlusstyp + Fachrichtung, Format: "Bachelor Bauingenieurwesen" oder "Master Maschinenbau" – KEIN "Abschluss im/in"]
• [weitere Abschlüsse im gleichen Format, falls vorhanden]

<b>Projekte:</b> [Beschreibung relevanter Projekte/Branchen – NUR generische Unternehmenstypen, KEINE Firmennamen]

<b>Hauptaufgaben:</b>

• [Hauptaufgabe 1 aus Berufserfahrung]
• [weitere Aufgaben...]

<b>EDV:</b> [Kenntnisse/Tools]

<b>Standort:</b> [Stadt/Region]

<b>Gehaltsvorstellung: ${gehaltsvorstellung}</b>

<b>Kündigungsfrist: ${kuendigungsfrist}</b>

Könnte der Kandidat für Sie von Interesse sein?
Bei Interesse vereinbare ich sehr gerne ein Gespräch.

Über Ihre Rückmeldung freue ich mich.

Wichtig: Gib nur BETREFF-Zeile und E-Mail-Text aus, nichts anderes. Trenne sie mit "---". Behalte alle <b>-Tags exakt wie in der Struktur vorgegeben. Kein Markdown, keine Sternchen.`
      : `Du bist ein Personalvermittler bei WeCruiting Consulting GmbH. Erstelle eine professionelle Kandidaten-Vorstellungs-E-Mail auf Deutsch.

Kandidatendaten:
${cvSummary}

Struktur der E-Mail (exakt einhalten):
BETREFF: ${fullName} - Top Profil: [Hauptposition mit Spezialisierung] Standort ${cityRegion || standort}
---
Sehr geehrte Damen und Herren,

anbei finden Sie das Profil eines sehr interessanten <b>[Beschreibung der Position mit Spezialisierung und Standort]</b>

<b>Profildaten:</b>

<b>Berufserfahrung: [X Jahre bei Y Unternehmen]</b>

<b>Ausbildung:</b>
• [Abschlusstyp + Fachrichtung, Format: "Bachelor Bauingenieurwesen" oder "Master Maschinenbau" – KEIN "Abschluss im/in"]
• [weitere Abschlüsse im gleichen Format, falls vorhanden]

<b>Projekte:</b> [Beschreibung relevanter Projekte/Branchen aus der Berufserfahrung, Projektvolumina falls erkennbar]

<b>Hauptaufgaben:</b>

• [Hauptaufgabe 1 aus Berufserfahrung]
• [weitere Aufgaben...]

<b>EDV:</b> [Kenntnisse/Tools]

<b>Standort:</b> [Stadt/Region]

<b>Gehaltsvorstellung: ${gehaltsvorstellung}</b>

<b>Kündigungsfrist: ${kuendigungsfrist}</b>

Könnte der Kandidat für Sie von Interesse sein?
Bei Interesse vereinbare ich sehr gerne ein Gespräch.

Über Ihre Rückmeldung freue ich mich.

Wichtig: Gib nur BETREFF-Zeile und E-Mail-Text aus, nichts anderes. Trenne sie mit "---". Behalte alle <b>-Tags exakt wie in der Struktur vorgegeben. Kein Markdown, keine Sternchen.`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1800,
      messages: [{
        role: 'user',
        content: emailPrompt,
      }],
    });

    console.log('[generateEmail] anon:', anon, '| fullName:', fullName);

    const raw = message.content[0].text.trim();
    const sepIdx = raw.indexOf('\n---');
    let subject = '';
    let body = raw;

    const stripBetreff = s => s.replace(/^\*{0,2}BETREFF:\*{0,2}\s*/i, '').trim();

    if (sepIdx !== -1) {
      subject = stripBetreff(raw.substring(0, sepIdx));
      body = raw.substring(sepIdx + 4).trim();
    } else if (/^\*{0,2}BETREFF:/i.test(raw)) {
      const lines = raw.split('\n');
      subject = stripBetreff(lines[0]);
      body = lines.slice(1).join('\n').trim();
    }

    // Anon: Strip any "Name - " prefix Claude may have added despite instructions
    if (anon && subject.includes(' - Top Profil:')) {
      subject = subject.replace(/^.+? - (Top Profil:.*)$/i, '$1').trim();
    }

    console.log('[generateEmail] subject:', subject);
    res.json({ subject, body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'E-Mail-Generierung fehlgeschlagen.' });
  }
};

async function fetchWebsiteText(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WeCruiting/1.0)' },
    });
    clearTimeout(timer);
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 4000);
  } catch {
    return '';
  }
}

exports.tailorCV = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cvs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

    const cvData = JSON.parse(rows[0].cv_data);
    const { companyUrl, gehaltsvorstellung = 'k.A.', kuendigungsfrist = 'k.A.' } = req.body;
    if (!companyUrl) return res.status(400).json({ error: 'companyUrl erforderlich.' });

    let companyDomain = companyUrl;
    try { companyDomain = new URL(companyUrl).hostname.replace(/^www\./, ''); } catch {}

    const companyText = await fetchWebsiteText(companyUrl);

    const { personalInfo: p = {}, workExperience = [], education = [], skills = [], languages = [] } = cvData;
    const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
    const standort = [p.city, p.country].filter(Boolean).join(', ');

    const currentYear = new Date().getFullYear();
    let totalYears = 0;
    workExperience.forEach(job => {
      const start = parseInt(job.startDate);
      const end = job.current ? currentYear : parseInt(job.endDate);
      if (!isNaN(start) && !isNaN(end) && end >= start) totalYears += end - start;
    });

    // Only the most recent job (current=true, or index 0) gets the detailed rewrite
    const currentJobIdx = workExperience.findIndex(j => j.current) !== -1
      ? workExperience.findIndex(j => j.current)
      : 0;
    const currentJob = workExperience[currentJobIdx];

    const jobsSummary = workExperience.map((j, idx) =>
      `[${idx}] ${j.position}${j.berufsbezeichnung ? ' / ' + j.berufsbezeichnung : ''} bei ${j.company} (${j.startDate}–${j.current ? 'heute' : j.endDate})\nBeschreibung: ${j.description || '(keine)'}`
    ).join('\n\n');

    const currentJobSummary = `[${currentJobIdx}] ${currentJob.position}${currentJob.berufsbezeichnung ? ' / ' + currentJob.berufsbezeichnung : ''} bei ${currentJob.company} (${currentJob.startDate}–${currentJob.current ? 'heute' : currentJob.endDate})\nBeschreibung: ${currentJob.description || '(keine)'}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Du bist ein Personalvermittler bei WeCruiting Consulting GmbH. Schneide den Lebenslauf und die Vorstellungs-E-Mail eines Kandidaten präzise auf ein konkretes Zielunternehmen zu.

ZIELUNTERNEHMEN: ${companyDomain}
WEBSITE-INHALT (Auszug):
${companyText || 'Nicht abrufbar – nutze die Domain als Kontext.'}

KANDIDAT: ${fullName} | Standort: ${standort}
Berufserfahrung: ca. ${totalYears} Jahre
Kenntnisse: ${skills.map(s => s.name).join(', ')}
Sprachen: ${languages.map(l => `${l.language} (${l.level})`).join(', ')}

ALLE TÄTIGKEITEN (Kontext für die E-Mail):
${jobsSummary}

AUFGABE TEIL 1 – Aktuelle Tätigkeit anpassen:
Schreibe NUR die Beschreibung der aktuellen/letzten Position neu – auf das Zielunternehmen zugeschnitten.
Alle anderen Positionen bleiben unverändert – gib sie NICHT im workExperience-Array zurück.

AKTUELLE POSITION (Index ${currentJobIdx}):
${currentJobSummary}

PFLICHT-FORMAT für die Tätigkeitsbeschreibung:
- 6–10 Aufzählungspunkte, jeder beginnt mit „• "
- Schlüsselbegriffe, Verantwortlichkeiten und Kernkompetenzen in **Fettschrift**: **Begriff**
  Beispiel: „• Übernahme der Verantwortung für **Kosten, Termine und Qualität** während des gesamten Bauprojekts"
  Beispiel: „• **Gesamtverantwortliche** Organisation, Koordination und Steuerung der Bauausführung"
  Beispiel: „• Sicherstellung der Einhaltung aller bautechnischen Vorschriften (**DIN, VOB, HOAI**)"
- Thematische Reihenfolge: 1) Kernverantwortung, 2) Operative Steuerung, 3) Qualität/Normen, 4) Führung/Koordination, 5) Verhandlung/Kaufmännisches
- Fachlich präzise, konkrete deutsche HR-Sprache – keine generischen Phrasen
- Betone Aspekte, die für dieses Zielunternehmen besonders relevant sind
- Erfinde NICHTS – nur Umformulierung, Schwerpunktverlagerung und Präzisierung
- Wenn keine Beschreibung vorhanden: 8 sinnvolle Punkte aus Position und Unternehmen ableiten

AUFGABE TEIL 2 – Zugeschnittene Vorstellungs-E-Mail:
Erstelle eine E-Mail die explizit auf dieses Unternehmen eingeht (Branche, Projekte, Bedarf).

E-Mail-Struktur (exakt mit diesen <b>-Tags):
BETREFF: ${fullName} - Top Profil: [Hauptposition] für [Unternehmensname/Branche] Standort [nur die nächstgelegene Großstadt oder Region, NICHT den genauen Wohnort]
---
Sehr geehrte Damen und Herren,

anbei finden Sie das Profil eines sehr interessanten <b>[Beschreibung + relevante Spezialisierung für dieses Unternehmen]</b>

<b>Profildaten:</b>

<b>Berufserfahrung: ${totalYears} Jahre</b>

<b>Ausbildung:</b>
• [Abschlusstyp + Fachrichtung, Format: "Bachelor Bauingenieurwesen" oder "Master Maschinenbau" – KEIN "Abschluss im/in"]
• [weitere Abschlüsse im gleichen Format, falls vorhanden]

<b>Projekte:</b> [Projekte die für dieses Unternehmen besonders relevant sind]

<b>Hauptaufgaben:</b>
[Aufgaben die zu diesem Unternehmen passen]

<b>EDV:</b> [relevante Kenntnisse]

<b>Standort:</b> ${standort}

<b>Gehaltsvorstellung: ${gehaltsvorstellung}</b>

<b>Kündigungsfrist: ${kuendigungsfrist}</b>

Könnte der Kandidat für Sie von Interesse sein?
Bei Interesse vereinbare ich sehr gerne ein Gespräch.

Über Ihre Rückmeldung freue ich mich.

Antworte ausschließlich im folgenden JSON-Format (kein Markdown, keine Codeblöcke):
{
  "workExperience": [
    { "index": 0, "description": "angepasste Beschreibung mit • Aufzählungen" }
  ],
  "email": {
    "subject": "Betreff",
    "body": "E-Mail-Text mit <b>-Tags"
  }
}`,
      }],
    });

    const raw = message.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'KI-Antwort konnte nicht verarbeitet werden.' });
    }

    const tailoredExperience = workExperience.map((job, idx) => {
      if (idx !== currentJobIdx) return job;
      const t = parsed.workExperience?.find(e => e.index === idx);
      return t ? { ...job, description: t.description } : job;
    });

    res.json({
      workExperience: tailoredExperience,
      email: parsed.email || {},
      companyDomain,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Zuschneiden fehlgeschlagen.' });
  }
};
