const pool = require('../database/db');

const parseTags = row => ({ ...row, tags: JSON.parse(row.tags || '[]') });

// ── CANDIDATES ─────────────────────────────────────────────────────────────────

exports.listCandidates = async (req, res) => {
  const { stage, search } = req.query;
  const params = [req.user.id];
  let where = 'WHERE c.user_id = $1';

  if (stage) {
    params.push(stage);
    where += ` AND c.pipeline_stage = $${params.length}`;
  }
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    params.push(term, term, term);
    const n = params.length;
    where += ` AND (LOWER(c.first_name) LIKE $${n - 2} OR LOWER(c.last_name) LIKE $${n - 1} OR LOWER(c.current_company) LIKE $${n})`;
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.*, cv.title AS cv_title
       FROM crm_candidates c
       LEFT JOIN cvs cv ON c.cv_id = cv.id
       ${where}
       ORDER BY c.updated_at DESC`,
      params
    );
    res.json(rows.map(parseTags));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Kandidaten.' });
  }
};

exports.getCandidate = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, cv.title AS cv_title
       FROM crm_candidates c
       LEFT JOIN cvs cv ON c.cv_id = cv.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Kandidat nicht gefunden.' });

    const { rows: activities } = await pool.query(
      `SELECT * FROM crm_activities
       WHERE entity_type = 'candidate' AND entity_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    const { rows: tasks } = await pool.query(
      `SELECT * FROM crm_tasks
       WHERE entity_type = 'candidate' AND entity_id = $1
       ORDER BY completed ASC, due_date ASC`,
      [req.params.id]
    );

    res.json({ ...parseTags(rows[0]), activities, tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden des Kandidaten.' });
  }
};

exports.createCandidate = async (req, res) => {
  const {
    first_name, last_name = '', email, phone,
    pipeline_stage = 'neu', current_position, current_company,
    desired_salary, notice_period, location, source = 'manuell',
    tags = [], notes = '', cv_id,
  } = req.body;

  if (!first_name) return res.status(400).json({ error: 'Vorname ist erforderlich.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO crm_candidates
        (user_id, cv_id, first_name, last_name, email, phone,
         pipeline_stage, current_position, current_company,
         desired_salary, notice_period, location, source, tags, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        req.user.id, cv_id || null, first_name, last_name, email || null, phone || null,
        pipeline_stage, current_position || null, current_company || null,
        desired_salary || null, notice_period || null, location || null,
        source, JSON.stringify(tags), notes,
      ]
    );
    res.status(201).json(parseTags(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Erstellen des Kandidaten.' });
  }
};

exports.importFromCV = async (req, res) => {
  try {
    const { rows: cvRows } = await pool.query(
      'SELECT * FROM cvs WHERE id = $1 AND user_id = $2',
      [req.params.cvId, req.user.id]
    );
    if (!cvRows[0]) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

    const existing = await pool.query(
      'SELECT id FROM crm_candidates WHERE cv_id = $1 AND user_id = $2',
      [req.params.cvId, req.user.id]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Dieser Lebenslauf wurde bereits importiert.', candidate_id: existing.rows[0].id });
    }

    const cv = cvRows[0];
    const data = JSON.parse(cv.cv_data || '{}');
    const p = data.personalInfo || {};
    const jobs = data.workExperience || [];
    const first = jobs[0] || {};

    const { rows } = await pool.query(
      `INSERT INTO crm_candidates
        (user_id, cv_id, first_name, last_name, email, phone,
         current_position, current_company, location, source, tags, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        req.user.id, cv.id,
        p.firstName || cv.title || 'Unbekannt',
        p.lastName || '',
        p.email || null,
        p.phone || null,
        first.position || first.berufsbezeichnung || null,
        first.company || null,
        [p.city, p.country].filter(Boolean).join(', ') || null,
        'lebenslauf',
        '[]', '',
      ]
    );
    res.status(201).json(parseTags(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Importieren des Lebenslaufs.' });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM crm_candidates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Kandidat nicht gefunden.' });

    const c = existing[0];
    const {
      first_name = c.first_name, last_name = c.last_name,
      email = c.email, phone = c.phone,
      pipeline_stage = c.pipeline_stage,
      current_position = c.current_position, current_company = c.current_company,
      desired_salary = c.desired_salary, notice_period = c.notice_period,
      location = c.location, source = c.source,
      tags, notes = c.notes, cv_id = c.cv_id,
    } = req.body;

    const prevStage = c.pipeline_stage;

    const { rows } = await pool.query(
      `UPDATE crm_candidates SET
        first_name=$1, last_name=$2, email=$3, phone=$4,
        pipeline_stage=$5, current_position=$6, current_company=$7,
        desired_salary=$8, notice_period=$9, location=$10,
        source=$11, tags=$12, notes=$13, cv_id=$14,
        updated_at=to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')
       WHERE id=$15 RETURNING *`,
      [
        first_name, last_name, email || null, phone || null,
        pipeline_stage, current_position || null, current_company || null,
        desired_salary || null, notice_period || null, location || null,
        source, JSON.stringify(tags !== undefined ? tags : JSON.parse(c.tags || '[]')),
        notes, cv_id || null, req.params.id,
      ]
    );

    if (prevStage !== pipeline_stage) {
      await pool.query(
        `INSERT INTO crm_activities (user_id, entity_type, entity_id, type, content)
         VALUES ($1, 'candidate', $2, 'status_aenderung', $3)`,
        [req.user.id, req.params.id, `Stage geändert: ${prevStage} → ${pipeline_stage}`]
      );
    }

    res.json(parseTags(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Kandidaten.' });
  }
};

exports.updateStage = async (req, res) => {
  const { stage } = req.body;
  if (!stage) return res.status(400).json({ error: 'stage fehlt.' });

  try {
    const { rows: existing } = await pool.query(
      'SELECT pipeline_stage FROM crm_candidates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Kandidat nicht gefunden.' });

    const prevStage = existing[0].pipeline_stage;

    await pool.query(
      `UPDATE crm_candidates SET pipeline_stage=$1, updated_at=to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') WHERE id=$2`,
      [stage, req.params.id]
    );

    if (prevStage !== stage) {
      await pool.query(
        `INSERT INTO crm_activities (user_id, entity_type, entity_id, type, content)
         VALUES ($1, 'candidate', $2, 'status_aenderung', $3)`,
        [req.user.id, req.params.id, `Stage geändert: ${prevStage} → ${stage}`]
      );
    }

    res.json({ success: true, stage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Stage.' });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM crm_candidates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Kandidat nicht gefunden.' });
    await pool.query('DELETE FROM crm_candidates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
};

// ── COMPANIES ──────────────────────────────────────────────────────────────────

exports.listCompanies = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT co.*,
        (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = co.id) AS contact_count,
        (SELECT COUNT(*) FROM crm_jobs j WHERE j.company_id = co.id AND j.status = 'offen') AS open_jobs
       FROM crm_companies co
       WHERE co.user_id = $1
       ORDER BY co.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Unternehmen.' });
  }
};

exports.getCompany = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM crm_companies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Unternehmen nicht gefunden.' });

    const { rows: contacts } = await pool.query(
      'SELECT * FROM crm_contacts WHERE company_id = $1 ORDER BY last_name',
      [req.params.id]
    );
    const { rows: jobs } = await pool.query(
      'SELECT * FROM crm_jobs WHERE company_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    const { rows: activities } = await pool.query(
      `SELECT * FROM crm_activities WHERE entity_type = 'company' AND entity_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ ...rows[0], contacts, jobs, activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden des Unternehmens.' });
  }
};

exports.createCompany = async (req, res) => {
  const { name, domain, industry, size, city, country = 'Deutschland', notes = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name ist erforderlich.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO crm_companies (user_id, name, domain, industry, size, city, country, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, name, domain || null, industry || null, size || null, city || null, country, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Erstellen des Unternehmens.' });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM crm_companies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Unternehmen nicht gefunden.' });
    const c = existing[0];

    const { name = c.name, domain = c.domain, industry = c.industry, size = c.size,
            city = c.city, country = c.country, notes = c.notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE crm_companies SET name=$1, domain=$2, industry=$3, size=$4, city=$5, country=$6, notes=$7,
        updated_at=to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') WHERE id=$8 RETURNING *`,
      [name, domain || null, industry || null, size || null, city || null, country, notes, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren.' });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM crm_companies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Unternehmen nicht gefunden.' });
    await pool.query('DELETE FROM crm_companies WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
};

// ── CONTACTS ───────────────────────────────────────────────────────────────────

exports.listContacts = async (req, res) => {
  const { company_id } = req.query;
  const params = [req.user.id];
  let where = 'WHERE ct.user_id = $1';
  if (company_id) { params.push(company_id); where += ` AND ct.company_id = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT ct.*, co.name AS company_name
       FROM crm_contacts ct
       LEFT JOIN crm_companies co ON ct.company_id = co.id
       ${where}
       ORDER BY ct.last_name`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Kontakte.' });
  }
};

exports.createContact = async (req, res) => {
  const { first_name, last_name = '', email, phone, position, company_id, notes = '' } = req.body;
  if (!first_name) return res.status(400).json({ error: 'Vorname ist erforderlich.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO crm_contacts (user_id, company_id, first_name, last_name, email, phone, position, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, company_id || null, first_name, last_name, email || null, phone || null, position || null, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Erstellen des Kontakts.' });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM crm_contacts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Kontakt nicht gefunden.' });
    const c = existing[0];

    const { first_name = c.first_name, last_name = c.last_name, email = c.email,
            phone = c.phone, position = c.position, company_id = c.company_id, notes = c.notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE crm_contacts SET first_name=$1, last_name=$2, email=$3, phone=$4, position=$5,
        company_id=$6, notes=$7, updated_at=to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') WHERE id=$8 RETURNING *`,
      [first_name, last_name, email || null, phone || null, position || null, company_id || null, notes, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren.' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM crm_contacts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Kontakt nicht gefunden.' });
    await pool.query('DELETE FROM crm_contacts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
};

// ── JOBS ───────────────────────────────────────────────────────────────────────

exports.listJobs = async (req, res) => {
  const { status } = req.query;
  const params = [req.user.id];
  let where = 'WHERE j.user_id = $1';
  if (status) { params.push(status); where += ` AND j.status = $${params.length}`; }

  try {
    const { rows } = await pool.query(
      `SELECT j.*, co.name AS company_name,
        (SELECT COUNT(*) FROM crm_applications a WHERE a.job_id = j.id) AS candidate_count
       FROM crm_jobs j
       LEFT JOIN crm_companies co ON j.company_id = co.id
       ${where}
       ORDER BY j.updated_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Stellen.' });
  }
};

exports.getJob = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT j.*, co.name AS company_name
       FROM crm_jobs j
       LEFT JOIN crm_companies co ON j.company_id = co.id
       WHERE j.id = $1 AND j.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Stelle nicht gefunden.' });

    const { rows: applications } = await pool.query(
      `SELECT a.*, c.first_name, c.last_name, c.current_position, c.email
       FROM crm_applications a
       JOIN crm_candidates c ON a.candidate_id = c.id
       WHERE a.job_id = $1 ORDER BY a.updated_at DESC`,
      [req.params.id]
    );
    res.json({ ...rows[0], applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Stelle.' });
  }
};

exports.createJob = async (req, res) => {
  const { title, company_id, description = '', location, salary_from, salary_to,
          status = 'offen', priority = 'mittel', notes = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'Titel ist erforderlich.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO crm_jobs (user_id, company_id, title, description, location, salary_from, salary_to, status, priority, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, company_id || null, title, description, location || null,
       salary_from || null, salary_to || null, status, priority, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Stelle.' });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM crm_jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Stelle nicht gefunden.' });
    const j = existing[0];

    const { title = j.title, company_id = j.company_id, description = j.description,
            location = j.location, salary_from = j.salary_from, salary_to = j.salary_to,
            status = j.status, priority = j.priority, notes = j.notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE crm_jobs SET title=$1, company_id=$2, description=$3, location=$4,
        salary_from=$5, salary_to=$6, status=$7, priority=$8, notes=$9,
        updated_at=to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') WHERE id=$10 RETURNING *`,
      [title, company_id || null, description, location || null,
       salary_from || null, salary_to || null, status, priority, notes, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren.' });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM crm_jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Stelle nicht gefunden.' });
    await pool.query('DELETE FROM crm_jobs WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
};

// ── APPLICATIONS (Kandidat × Job) ─────────────────────────────────────────────

exports.createApplication = async (req, res) => {
  const { candidate_id, job_id, stage = 'beworben', notes = '' } = req.body;
  if (!candidate_id || !job_id) return res.status(400).json({ error: 'candidate_id und job_id erforderlich.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO crm_applications (user_id, candidate_id, job_id, stage, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, candidate_id, job_id, stage, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Bewerbung.' });
  }
};

exports.updateApplication = async (req, res) => {
  const { stage, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE crm_applications SET stage=COALESCE($1, stage), notes=COALESCE($2, notes),
        updated_at=to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') WHERE id=$3 AND user_id=$4 RETURNING *`,
      [stage || null, notes || null, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Bewerbung nicht gefunden.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren.' });
  }
};

// ── ACTIVITIES ─────────────────────────────────────────────────────────────────

exports.listActivities = async (req, res) => {
  const { entityType, entityId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM crm_activities
       WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3
       ORDER BY created_at DESC`,
      [req.user.id, entityType, entityId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Aktivitäten.' });
  }
};

exports.createActivity = async (req, res) => {
  const { entity_type, entity_id, type = 'notiz', content } = req.body;
  if (!entity_type || !entity_id || !content) {
    return res.status(400).json({ error: 'entity_type, entity_id und content sind erforderlich.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO crm_activities (user_id, entity_type, entity_id, type, content)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, entity_type, entity_id, type, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Aktivität.' });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM crm_activities WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
};

// ── TASKS ──────────────────────────────────────────────────────────────────────

exports.listTasks = async (req, res) => {
  const { entity_type, entity_id } = req.query;
  const params = [req.user.id];
  let where = 'WHERE user_id = $1';
  if (entity_type && entity_id) {
    params.push(entity_type, entity_id);
    where += ` AND entity_type = $${params.length - 1} AND entity_id = $${params.length}`;
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM crm_tasks ${where} ORDER BY completed ASC, due_date ASC NULLS LAST`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Aufgaben.' });
  }
};

exports.createTask = async (req, res) => {
  const { title, entity_type, entity_id, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Titel ist erforderlich.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO crm_tasks (user_id, entity_type, entity_id, title, due_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, entity_type || null, entity_id || null, title, due_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Aufgabe.' });
  }
};

exports.toggleTask = async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT completed FROM crm_tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });

    const { rows } = await pool.query(
      'UPDATE crm_tasks SET completed = $1 WHERE id = $2 RETURNING *',
      [existing[0].completed ? 0 : 1, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await pool.query('DELETE FROM crm_tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
};

// ── DASHBOARD STATS ────────────────────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
    const uid = req.user.id;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);

    const [candidates, companies, jobs, placements, activities] = await Promise.all([
      pool.query(`SELECT pipeline_stage, COUNT(*) AS count FROM crm_candidates WHERE user_id=$1 GROUP BY pipeline_stage`, [uid]),
      pool.query(`SELECT COUNT(*) AS count FROM crm_companies WHERE user_id=$1`, [uid]),
      pool.query(`SELECT status, COUNT(*) AS count FROM crm_jobs WHERE user_id=$1 GROUP BY status`, [uid]),
      pool.query(`SELECT COUNT(*) AS count FROM crm_candidates WHERE user_id=$1 AND pipeline_stage='platziert'`, [uid]),
      pool.query(`SELECT COUNT(*) AS count FROM crm_activities WHERE user_id=$1 AND created_at >= $2`, [uid, thirtyDaysAgo]),
    ]);

    const stageMap = {};
    for (const r of candidates.rows) stageMap[r.pipeline_stage] = parseInt(r.count);

    res.json({
      candidatesByStage: stageMap,
      totalCandidates: Object.values(stageMap).reduce((a, b) => a + b, 0),
      totalCompanies: parseInt(companies.rows[0]?.count || 0),
      openJobs: parseInt(jobs.rows.find(r => r.status === 'offen')?.count || 0),
      totalJobs: jobs.rows.reduce((a, r) => a + parseInt(r.count), 0),
      placements: parseInt(placements.rows[0]?.count || 0),
      activitiesLast30Days: parseInt(activities.rows[0]?.count || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Statistiken.' });
  }
};
