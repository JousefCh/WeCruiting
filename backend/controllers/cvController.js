const pool = require('../database/db');

exports.list = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, thumbnail, created_at, updated_at FROM cvs WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(rows);
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

    const { rows } = await pool.query(
      `UPDATE cvs SET title = $1, cv_data = $2, thumbnail = $3,
       updated_at = to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS') WHERE id = $4 RETURNING *`,
      [
        title !== undefined ? title.trim() : cv.title,
        cvData !== undefined ? JSON.stringify(cvData) : cv.cv_data,
        thumbnail !== undefined ? thumbnail : cv.thumbnail,
        req.params.id,
      ]
    );
    const updated = rows[0];
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
