const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.generateCoverLetter = async (req, res) => {
  const { cvData, jobTitle, company, jobDescription } = req.body;

  if (!jobTitle || !company) {
    return res.status(400).json({ error: 'Bitte Stelle und Unternehmen angeben.' });
  }

  const { personalInfo = {}, workExperience = [], skills = [] } = cvData || {};
  const name = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ') || 'Bewerber/in';
  const lastJob = workExperience[0];
  const topSkills = skills.slice(0, 5).map(s => s.name).join(', ');

  const systemPrompt = `Du bist ein professioneller Karriereberater mit umfangreicher Erfahrung im deutschen Arbeitsmarkt. \
Du erstellst überzeugende, individuelle Bewerbungsanschreiben auf Deutsch. \
Format: Geschäftsbrief nach DIN 5008. Beginne direkt mit der Anrede (z.B. "Sehr geehrte Damen und Herren,"). \
Kein Markdown, keine Sternchen, keine Überschriften. \
Maximale Länge: 380 Wörter im Briefkörper. \
Schreibe authentisch, professionell und überzeugend.`;

  const userPrompt = `Erstelle ein Bewerbungsanschreiben für folgende Person und Stelle:

BEWERBER:
Name: ${name}
${lastJob ? `Letzte Position: ${lastJob.position} bei ${lastJob.company}` : ''}
${topSkills ? `Kernkompetenzen: ${topSkills}` : ''}
${personalInfo.summary ? `Profil: ${personalInfo.summary}` : ''}

STELLE:
Unternehmen: ${company}
Position: ${jobTitle}
${jobDescription ? `Stellenbeschreibung:\n${jobDescription}` : ''}

Erstelle ein professionelles Anschreiben. Beginne direkt mit "Sehr geehrte Damen und Herren," \
(falls kein Ansprechpartner bekannt). Gliedere es in: Einleitung (warum diese Stelle?), \
Hauptteil (Qualifikationen und Mehrwert für das Unternehmen), Schluss (Einladung zum Gespräch). \
Abschluss mit "Mit freundlichen Grüßen" und dem Namen des Bewerbers.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    res.json({ coverLetter: response.content[0].text });
  } catch (err) {
    console.error('Anthropic API error:', err);
    res.status(500).json({ error: 'Das Anschreiben konnte nicht generiert werden. Bitte erneut versuchen.' });
  }
};
