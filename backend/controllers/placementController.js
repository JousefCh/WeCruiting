const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Anthropic = require('@anthropic-ai/sdk');
const { searchCompanies, findEmails, scoreEmail } = require('../services/placementService');
const instantly = require('../services/instantlyService');

// ── Company analysis (website fetch + Claude) ──────────────────────────────────

async function fetchHomepageText(domain) {
  const urls = [`https://${domain}`, `https://www.${domain}`];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WeCruiting/1.0)' },
      });
      if (!res.ok) continue;
      const html = await res.text();
      // Strip scripts, styles, tags — keep visible text
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);
      if (text.length > 100) return text;
    } catch { /* timeout or network error — try next */ }
  }
  return null;
}

exports.analyzeCompany = async (req, res) => {
  const { companyName, position, candidateContext } = req.body;
  if (!companyName) return res.status(400).json({ error: 'companyName fehlt.' });

  // 1. Find company domain via Serper
  let domain = null;
  let searchSnippets = '';
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    try {
      const serperRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `"${companyName}" offizielle Website`, gl: 'de', hl: 'de', num: 5 }),
      });
      const serperData = await serperRes.json();
      const skipPattern = /linkedin|xing|kununu|wikipedia|facebook|instagram|youtube|glassdoor/i;
      for (const r of serperData.organic || []) {
        if (skipPattern.test(r.link)) { searchSnippets += r.snippet + ' '; continue; }
        try {
          domain = new URL(r.link).hostname.replace(/^www\./, '');
          searchSnippets += (r.snippet || '') + ' ';
          break;
        } catch { /* malformed URL */ }
      }
    } catch (e) {
      console.warn('[analyzeCompany] Serper error:', e.message);
    }
  }

  // 2. Fetch homepage content
  const homepageText = domain ? await fetchHomepageText(domain) : null;

  // 3. Build context blocks
  const employerParts = [
    `Unternehmensname (aktueller Arbeitgeber): ${companyName}`,
    position ? `Position des Kandidaten dort: ${position}` : null,
    domain ? `Website: ${domain}` : null,
    searchSnippets.trim() ? `Google-Snippets: ${searchSnippets.trim().slice(0, 600)}` : null,
    homepageText ? `Homepage-Inhalt (Auszug): ${homepageText}` : null,
  ].filter(Boolean).join('\n');

  const candidateParts = [];
  if (candidateContext) {
    const { positions = [], skills = [], yearsExp } = candidateContext;
    if (positions.length > 1) {
      candidateParts.push(
        `Alle bisherigen Positionen: ${positions.map(p => `${p.position}${p.company ? ' bei ' + p.company : ''}`).join('; ')}`
      );
    }
    if (skills.length) candidateParts.push(`Fachkenntnisse: ${skills.join(', ')}`);
    if (yearsExp) candidateParts.push(`Berufserfahrung: ca. ${yearsExp} Jahre`);
  }

  const fullContext = [employerParts, candidateParts.join('\n')].filter(Boolean).join('\n\n');

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Analysiere den Kandidaten und sein aktuelles Unternehmen. Beantworte:
1. Welchen exakten Unternehmenstyp ist der Arbeitgeber? (z.B. "Ausführendes Bauunternehmen (Tiefbau/Straßenbau)", "Ingenieurbüro für Tragwerksplanung")
2. Was ist die Fachspezialisierung des Kandidaten? (1 präziser Satz, z.B. "Bauleiter mit 10 Jahren Erfahrung im Straßen- und Tiefbau")
3. Welche 2-3 verschiedenen Unternehmenstypen würden diesen Kandidaten suchen?
4. Welche 3-5 Suchbegriffe finden solche Zielunternehmen am besten?
5. Welche Branche/Tätigkeitsfeld?

${fullContext}

Antworte NUR als JSON:
{
  "companyType": "Exakter Unternehmenstyp des Arbeitgebers (max. 60 Zeichen)",
  "industry": "Branche/Tätigkeitsfeld (max. 40 Zeichen)",
  "searchTerms": ["Begriff1", "Begriff2", "Begriff3"],
  "description": "1-2 Sätze was das Unternehmen macht",
  "candidateSummary": "1 Satz: Fachspezialisierung des Kandidaten",
  "targetCompanyTypes": ["Typ1", "Typ2", "Typ3"]
}`,
      }],
    });

    const raw = message.content[0].text.trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const analysis = JSON.parse(raw);
    res.json({ ...analysis, domain: domain || null });
  } catch (err) {
    console.error('[analyzeCompany] Claude error:', err.message);
    res.json({
      companyType: 'Unternehmen',
      industry: position || '',
      searchTerms: [companyName],
      description: '',
      candidateSummary: '',
      targetCompanyTypes: [],
      domain: domain || null,
    });
  }
};

// ── Company search ─────────────────────────────────────────────────────────────

exports.searchCompanies = async (req, res) => {
  const { industry, location, companyType, keywords } = req.body;
  if (!industry || !location) return res.status(400).json({ error: 'Branche und Standort sind erforderlich.' });
  try {
    const companies = await searchCompanies({ industry, location, companyType, keywords });
    res.json({ companies });
  } catch (err) {
    console.error('[Placement] searchCompanies:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── Email discovery ────────────────────────────────────────────────────────────

exports.findEmails = async (req, res) => {
  const { domains } = req.body; // [{ name, domain }]
  if (!Array.isArray(domains) || !domains.length) return res.status(400).json({ error: 'domains fehlt.' });

  try {
    const results = await Promise.all(domains.map(async ({ name, domain }) => {
      const emails = await findEmails(domain);
      return {
        name,
        domain,
        emails: [...emails].sort((a, b) => scoreEmail(b) - scoreEmail(a)),
      };
    }));
    res.json({ results });
  } catch (err) {
    console.error('[Placement] findEmails:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── Email sending ──────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

exports.sendEmails = async (req, res) => {
  const { recipients, subject, body, pdfBase64, filename } = req.body;
  if (!Array.isArray(recipients) || !recipients.length) return res.status(400).json({ error: 'recipients fehlt.' });
  if (!subject || !body) return res.status(400).json({ error: 'subject und body fehlen.' });

  const smtpReady = process.env.SMTP_HOST && process.env.SMTP_USER &&
    process.env.SMTP_PASS && process.env.SMTP_PASS !== 'IHR_E-MAIL-PASSWORT';

  if (!smtpReady) {
    console.log('[Placement] SMTP nicht konfiguriert — Versand simuliert.');
    console.log('[Placement] Empfänger:', recipients.map(r => r.email).join(', '));
    return res.json({
      sent: recipients.length,
      failed: 0,
      simulated: true,
      message: `${recipients.length} E-Mails simuliert (SMTP_PASS in .env setzen für echten Versand).`,
    });
  }

  const transporter = createTransporter();
  const attachments = pdfBase64 ? [{
    filename: filename || 'Profil.pdf',
    content: Buffer.from(pdfBase64, 'base64'),
    contentType: 'application/pdf',
  }] : [];

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const r of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: r.email,
        subject,
        text: body,
        attachments,
      });
      sent++;
    } catch (err) {
      failed++;
      errors.push({ email: r.email, error: err.message });
      console.error(`[Placement] Versand an ${r.email} fehlgeschlagen:`, err.message);
    }
  }

  res.json({ sent, failed, errors, message: `${sent} von ${recipients.length} E-Mails versendet.` });
};

// ── Instantly: create campaign, add leads, activate ───────────────────────────

exports.instantlyCreateCampaign = async (req, res) => {
  const { candidateName, subject, body, pdfBase64, pdfFilename, recipients } = req.body;
  if (!candidateName) return res.status(400).json({ error: 'candidateName fehlt.' });
  if (!Array.isArray(recipients) || !recipients.length) return res.status(400).json({ error: 'recipients fehlt.' });
  if (!subject || !body) return res.status(400).json({ error: 'subject und body fehlen.' });

  // 1. Save CV PDF to temp folder and get public URL
  let cvUrl = null;
  if (pdfBase64) {
    const uuid = crypto.randomUUID();
    const tempDir = path.join(__dirname, '../public/temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, `${uuid}.pdf`), Buffer.from(pdfBase64, 'base64'));
    const backendUrl = (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
    cvUrl = `${backendUrl}/temp/${uuid}.pdf`;
  }

  // 2. Build attachments list (AGB first, then CV)
  const attachments = [];
  if (process.env.INSTANTLY_AGB_URL) {
    attachments.push({ filename: 'AGB_WeCruiting.pdf', url: process.env.INSTANTLY_AGB_URL });
  }
  if (cvUrl) {
    attachments.push({ filename: pdfFilename || 'Kandidatenprofil.pdf', url: cvUrl });
  }

  // 3. Create campaign with sequences
  const sequences = instantly.buildSequences(subject, body, attachments);
  let campaign;
  try {
    campaign = await instantly.createCampaign({ name: `WeCruiting – ${candidateName}`, sequences });
  } catch (err) {
    console.error('[Instantly] createCampaign:', err.message);
    return res.status(500).json({ error: err.message });
  }

  // 4. Add leads
  const leads = recipients.map(r => ({
    email: r.email,
    first_name: r.firstName || '',
    last_name: r.lastName || '',
    company_name: r.company || '',
    custom_variables: { position: r.position || '', kandidat: candidateName },
  }));
  try {
    await instantly.addLeads(campaign.id, leads);
  } catch (err) {
    console.error('[Instantly] addLeads:', err.message);
  }

  // 5. Activate campaign
  try {
    await instantly.activateCampaign(campaign.id);
  } catch (err) {
    console.error('[Instantly] activateCampaign:', err.message);
  }

  res.json({
    campaignId: campaign.id,
    campaignName: `WeCruiting – ${candidateName}`,
    added: leads.length,
    message: `Kampagne "WeCruiting – ${candidateName}" erstellt mit ${leads.length} Leads gestartet.`,
  });
};
