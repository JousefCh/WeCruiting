const pool = require('../database/db');

async function syncCandidateToCRM(userId, cvId, cvData) {
  const p = cvData.personalInfo || {};
  if (!p.firstName) return;

  const jobs = cvData.workExperience || [];
  const first = jobs[0] || {};
  const firstName      = p.firstName;
  const lastName       = p.lastName || '';
  const email          = p.email || null;
  const phone          = p.phone || null;
  const location       = [p.city, p.country].filter(Boolean).join(', ') || null;
  const currentPos     = first.position || first.berufsbezeichnung || null;
  const currentCompany = first.company || null;

  const { rows } = await pool.query(
    'SELECT id FROM crm_candidates WHERE cv_id = $1 AND user_id = $2',
    [cvId, userId]
  );

  if (rows[0]) {
    await pool.query(
      `UPDATE crm_candidates SET
         first_name=$1, last_name=$2, email=$3, phone=$4,
         current_position=$5, current_company=$6, location=$7,
         updated_at=to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')
       WHERE id=$8`,
      [firstName, lastName, email, phone, currentPos, currentCompany, location, rows[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO crm_candidates
         (user_id, cv_id, first_name, last_name, email, phone,
          current_position, current_company, location, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [userId, cvId, firstName, lastName, email, phone, currentPos, currentCompany, location, 'lebenslauf']
    );
  }
}

exports.list = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, cv_data, thumbnail, created_at, updated_at FROM cvs WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    const result = rows.map(cv => {
      const p = JSON.parse(cv.cv_data || '{}').personalInfo || {};
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
      return { id: cv.id, title: name || cv.title, thumbnail: cv.thumbnail, created_at: cv.created_at, updated_at: cv.updated_at };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title = 'Mein Lebenslauf', cvData = {} } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO cvs (user_id, title, cv_data) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, title.trim(), JSON.stringify(cvData)]
    );
    const cv = rows[0];
    syncCandidateToCRM(req.user.id, cv.id, JSON.parse(cv.cv_data || '{}')).catch(e =>
      console.error('[CRM Sync create]', e.message)
    );
    res.status(201).json({ ...cv, cvData: JSON.parse(cv.cv_data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cvs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });
    const cv = rows[0];
    res.json({ ...cv, cvData: JSON.parse(cv.cv_data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM cvs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

    const { title, cvData, thumbnail } = req.body;
    const cv = existing[0];

    const parsedData = cvData !== undefined ? cvData : JSON.parse(cv.cv_data || '{}');
    const p = parsedData.personalInfo || {};
    const nameTitle = [p.firstName, p.lastName].filter(Boolean).join(' ');
    const effectiveTitle = nameTitle || (title !== undefined ? title.trim() : cv.title);

    const { rows } = await pool.query(
      `UPDATE cvs SET title = $1, cv_data = $2, thumbnail = $3,
       updated_at = to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') WHERE id = $4 RETURNING *`,
      [
        effectiveTitle,
        cvData !== undefined ? JSON.stringify(cvData) : cv.cv_data,
        thumbnail !== undefined ? thumbnail : cv.thumbnail,
        req.params.id,
      ]
    );
    const updated = rows[0];
    syncCandidateToCRM(req.user.id, updated.id, JSON.parse(updated.cv_data || '{}')).catch(e =>
      console.error('[CRM Sync update]', e.message)
    );
    res.json({ ...updated, cvData: JSON.parse(updated.cv_data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM cvs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

    await pool.query('DELETE FROM cvs WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
  }
};
