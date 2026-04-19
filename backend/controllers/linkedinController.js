const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── multer setup ─────────────────────────────────────────────────────────────

const _upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * Wrap multer's callback-based middleware in a Promise so we can use
 * try/catch inside an async route handler and return structured JSON errors
 * instead of relying on Express's 4-arg error-handler chain.
 */
function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    _upload.single('pdf')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── language level helper ─────────────────────────────────────────────────────

const VALID_LANGUAGE_LEVELS = ['Grundkenntnisse', 'Gut', 'Sehr gut', 'Fließend', 'Verhandlungssicher', 'Muttersprache'];

function sanitizeLanguageLevel(level) {
  if (!level) return 'Sehr gut';
  if (VALID_LANGUAGE_LEVELS.includes(level)) return level;
  const lower = level.toLowerCase();
  if (lower.includes('native') || lower.includes('mutter')) return 'Muttersprache';
  if (lower.includes('full professional') || lower.includes('verhandlung')) return 'Verhandlungssicher';
  if (lower.includes('fluent') || lower.includes('fließend') || lower.includes('professional working')) return 'Fließend';
  if (lower.includes('sehr gut') || lower.includes('limited working')) return 'Sehr gut';
  if (lower.includes('gut') || lower.includes('elementary') || lower.includes('good')) return 'Gut';
  if (lower.includes('grundkenntnisse') || lower.includes('basic')) return 'Grundkenntnisse';
  return 'Sehr gut';
}

// ── main handler ──────────────────────────────────────────────────────────────

exports.parseLinkedInProfile = async (req, res) => {
  // 1. Receive the PDF via multer
  try {
    await runUpload(req, res);
  } catch (uploadErr) {
    console.error('[LinkedIn] Upload error:', uploadErr.message);
    const msg = uploadErr.code === 'LIMIT_FILE_SIZE'
      ? 'Die Datei ist zu groß (max. 10 MB).'
      : uploadErr.message || 'Datei-Upload fehlgeschlagen.';
    return res.status(400).json({ error: msg });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Bitte laden Sie eine PDF-Datei hoch.' });
  }

  // Validate mime type (in case the browser sends a different content-type)
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Nur PDF-Dateien werden akzeptiert.' });
  }

  // 2. Extract text from the PDF
  let profileText;
  try {
    const parsed = await pdfParse(req.file.buffer);
    profileText = parsed.text || '';
  } catch (pdfErr) {
    console.error('[LinkedIn] PDF parse error:', pdfErr.message);
    return res.status(422).json({ error: 'Die PDF-Datei konnte nicht gelesen werden. Bitte stellen Sie sicher, dass es sich um den LinkedIn-Export handelt.' });
  }

  if (profileText.trim().length < 30) {
    return res.status(422).json({ error: 'Die PDF enthält zu wenig Text. Bitte verwenden Sie den LinkedIn-Profilexport (Profil → Mehr → Als PDF speichern).' });
  }

  const profileUrl = (req.body.profileUrl || '').trim();

  // 3. Ask Claude to extract structured CV data
  const systemPrompt = `You are a precise CV data extraction expert. Your job is to extract structured CV/resume data from LinkedIn profile text.

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation text. Just the raw JSON object.

Required JSON structure:
{
  "personalInfo": {
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "city": "",
    "country": "",
    "linkedin": "",
    "summary": ""
  },
  "workExperience": [
    {
      "company": "",
      "position": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "grade": ""
    }
  ],
  "skills": [
    { "name": "", "level": 3 }
  ],
  "languages": [
    { "language": "", "level": "Fließend" }
  ],
  "hobbies": []
}

Rules:
- Dates must be formatted as "YYYY-MM" (e.g. "2020-03") or empty string "" if unknown
- If a job is current/present, set current=true and endDate=""
- skill level is an integer 1-5 (default 3)
- language level must be exactly one of: "Grundkenntnisse", "Gut", "Sehr gut", "Fließend", "Verhandlungssicher", "Muttersprache"
- If you cannot determine a value, use empty string "" (never null)
- For description fields, use plain text with bullet points starting with "• " where appropriate`;

  const userPrompt = `Extract all CV data from the following LinkedIn profile PDF text.
${profileUrl ? `LinkedIn URL: ${profileUrl}` : ''}

Profile text:
${profileText.slice(0, 10000)}`;

  let parsed;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = response.content[0].text.trim();
    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (aiErr) {
    console.error('[LinkedIn] AI/parse error:', aiErr.message);
    return res.status(500).json({ error: 'Die Profildaten konnten nicht verarbeitet werden. Bitte erneut versuchen.' });
  }

  // 4. Sanitise and return
  if (profileUrl && parsed.personalInfo) {
    parsed.personalInfo.linkedin = profileUrl;
  }

  if (Array.isArray(parsed.languages)) {
    parsed.languages = parsed.languages.map(l => ({ ...l, level: sanitizeLanguageLevel(l.level) }));
  }

  if (Array.isArray(parsed.skills)) {
    parsed.skills = parsed.skills.map(s => ({
      ...s,
      level: Math.min(5, Math.max(1, parseInt(s.level, 10) || 3)),
    }));
  }

  res.json({ data: parsed });
};
