// ── Company discovery ──────────────────────────────────────────────────────────

async function searchCompanies({ industry, location, companyType, keywords = '', radius = 50 }) {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) throw new Error('SERPER_API_KEY nicht konfiguriert. Bitte unter serper.dev registrieren und in .env eintragen.');

  const radiusStr = radius ? `${radius}km Umkreis` : '';
  const q = [industry, companyType, 'Unternehmen', location, radiusStr, keywords, '(GmbH OR AG OR KG)']
    .filter(Boolean).join(' ');

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, gl: 'de', hl: 'de', num: 20 }),
  });
  if (!res.ok) throw new Error(`Serper API Fehler: ${res.status}`);

  const data = await res.json();
  const skip = /linkedin|xing|stepstone|indeed|kununu|monster|wikipedia|facebook|instagram|twitter|youtube|google/i;

  const companies = [];
  for (const r of data.organic || []) {
    if (skip.test(r.link)) continue;
    try {
      const domain = new URL(r.link).hostname.replace(/^www\./, '');
      if (companies.some(c => c.domain === domain)) continue;
      companies.push({
        name: r.title.replace(/\s*[-|–|·].*$/, '').trim(),
        domain,
        website: `https://${domain}`,
        description: r.snippet || '',
        source: 'serper',
      });
    } catch { /* ignore malformed URLs */ }
  }
  return companies;
}

// ── Hunter.io email finder ─────────────────────────────────────────────────────

async function findEmailsHunter(domain) {
  const key = process.env.HUNTER_API_KEY;
  if (!key) throw new Error('HUNTER_API_KEY nicht konfiguriert.');

  const res = await fetch(
    `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${key}&limit=20`
  );
  if (!res.ok) throw new Error(`Hunter ${res.status}`);
  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors[0]?.details || 'Hunter Fehler');

  return (data.data?.emails || []).map(e => ({
    email: e.value,
    type: e.type,
    firstName: e.first_name || '',
    lastName: e.last_name || '',
    position: e.position || '',
    confidence: e.confidence || 0,
    source: 'hunter',
  }));
}

// ── SNOV.io email finder ───────────────────────────────────────────────────────

let _snovToken = null;
let _snovExpiry = 0;

async function getSnovToken() {
  if (_snovToken && Date.now() < _snovExpiry) return _snovToken;
  const res = await fetch('https://api.snov.io/v1/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.SNOV_CLIENT_ID,
      client_secret: process.env.SNOV_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`SNOV auth ${res.status}`);
  const d = await res.json();
  _snovToken = d.access_token;
  _snovExpiry = Date.now() + ((d.expires_in || 3600) - 60) * 1000;
  return _snovToken;
}

async function findEmailsSNOV(domain) {
  if (!process.env.SNOV_CLIENT_ID) throw new Error('SNOV nicht konfiguriert.');
  const token = await getSnovToken();

  const res = await fetch('https://api.snov.io/v1/get-domain-emails-with-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token, domain, type: 'all', limit: 20 }),
  });
  if (!res.ok) throw new Error(`SNOV ${res.status}`);
  const data = await res.json();

  return (data.emails || []).map(e => ({
    email: e.email,
    type: e.emailType || 'personal',
    firstName: e.firstName || '',
    lastName: e.lastName || '',
    position: e.position || '',
    confidence: e.confidence || 0,
    source: 'snov',
  }));
}

// ── Combined finder (Hunter primary, SNOV fallback) ───────────────────────────

async function findEmails(domain) {
  try {
    const emails = await findEmailsHunter(domain);
    if (emails.length > 0) return emails;
  } catch (e) {
    console.warn(`[Placement] Hunter failed for ${domain}:`, e.message);
  }
  try {
    return await findEmailsSNOV(domain);
  } catch (e) {
    console.warn(`[Placement] SNOV failed for ${domain}:`, e.message);
    return [];
  }
}

// ── Priority scoring ───────────────────────────────────────────────────────────
// Higher = more important target

function scoreEmail(email) {
  const pos = (email.position || '').toLowerCase();
  const addr = email.email.toLowerCase();
  if (/geschäftsführ|gesch.ftsf|managing.dir|ceo|inhaber|owner/.test(pos)) return 100;
  if (/niederlassung|branch.man|regional.dir|standortl/.test(pos)) return 90;
  if (/personal(?!wesen)|hr\b|human.res|recruiting|talent/.test(pos)) return 85;
  if (/^(bewerbung|karriere|jobs|hr|recruiting)@/.test(addr)) return 80;
  if (/^(info|kontakt|contact|anfrage)@/.test(addr)) return 60;
  if (/^(post|mail|office|service)@/.test(addr)) return 50;
  return email.type === 'personal' ? 40 : 30;
}

module.exports = { searchCompanies, findEmails, scoreEmail };
