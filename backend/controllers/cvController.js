const db = require('../database/db');

exports.list = (req, res) => {
  const cvs = db
    .prepare('SELECT id, title, thumbnail, created_at, updated_at FROM cvs WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.user.id);
  res.json(cvs);
};

exports.create = (req, res) => {
  const { title = 'Mein Lebenslauf', cvData = {} } = req.body;
  const stmt = db.prepare(
    'INSERT INTO cvs (user_id, title, cv_data) VALUES (?, ?, ?)'
  );
  const result = stmt.run(req.user.id, title.trim(), JSON.stringify(cvData));
  const cv = db.prepare('SELECT * FROM cvs WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json({ ...cv, cvData: JSON.parse(cv.cv_data) });
};

exports.getOne = (req, res) => {
  const cv = db
    .prepare('SELECT * FROM cvs WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!cv) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });
  res.json({ ...cv, cvData: JSON.parse(cv.cv_data) });
};

exports.update = (req, res) => {
  const cv = db
    .prepare('SELECT id FROM cvs WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!cv) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

  const { title, cvData, thumbnail } = req.body;
  const existing = db.prepare('SELECT * FROM cvs WHERE id = ?').get(req.params.id);

  db.prepare(
    'UPDATE cvs SET title = ?, cv_data = ?, thumbnail = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(
    title !== undefined ? title.trim() : existing.title,
    cvData !== undefined ? JSON.stringify(cvData) : existing.cv_data,
    thumbnail !== undefined ? thumbnail : existing.thumbnail,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM cvs WHERE id = ?').get(req.params.id);
  res.json({ ...updated, cvData: JSON.parse(updated.cv_data) });
};

exports.remove = (req, res) => {
  const cv = db
    .prepare('SELECT id FROM cvs WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!cv) return res.status(404).json({ error: 'Lebenslauf nicht gefunden.' });

  db.prepare('DELETE FROM cvs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
};
