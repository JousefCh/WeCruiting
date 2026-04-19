const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../database/db');

function createMailTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.register = (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Bitte alle Felder ausfüllen.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
  const result = stmt.run(email.toLowerCase(), hash, name.trim());

  const user = { id: Number(result.lastInsertRowid), email: email.toLowerCase(), name: name.trim() };
  const token = signToken(user);

  res.status(201).json({ token, user });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Bitte E-Mail und Passwort eingeben.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Ungültige E-Mail-Adresse oder falsches Passwort.' });
  }

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Bitte E-Mail-Adresse eingeben.' });

  // Always return success to prevent user enumeration
  const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.json({ message: 'ok' });

  // Invalidate old tokens for this user
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)')
    .run(user.id, token, expiresAt);

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/passwort-neu-setzen?token=${token}`;

  try {
    const transporter = createMailTransport();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@wecruiting.de',
      to: email,
      subject: 'WeCruiting – Passwort zurücksetzen',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
          <div style="background:#005542;padding:24px 32px;border-radius:8px 8px 0 0">
            <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/we_logo_white_tran.png"
                 alt="WeCruiting" style="height:56px" />
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="margin:0 0 12px">Hallo ${user.name},</h2>
            <p style="color:#4b5563;line-height:1.6">
              Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.
              Klicken Sie auf den Button, um ein neues Passwort zu vergeben.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${resetUrl}"
                 style="background:#005542;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block">
                Passwort zurücksetzen
              </a>
            </div>
            <p style="color:#9ca3af;font-size:13px;line-height:1.6">
              Dieser Link ist 1 Stunde gültig. Falls Sie keine Anfrage gestellt haben,
              können Sie diese E-Mail ignorieren.
            </p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0" />
            <p style="color:#9ca3af;font-size:12px">
              WeCruiting Consulting GmbH · Ruhrstraße 4a, 63452 Hanau
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('E-Mail konnte nicht gesendet werden:', err.message);
    return res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden. Bitte später erneut versuchen.' });
  }

  res.json({ message: 'ok' });
};

exports.resetPassword = (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Ungültige Anfrage.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });

  const record = db.prepare(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0'
  ).get(token);

  if (!record) return res.status(400).json({ error: 'Dieser Link ist ungültig.' });
  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen an.' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hash, record.user_id);
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?')
    .run(record.id);

  res.json({ message: 'Passwort erfolgreich geändert.' });
};

exports.changePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Bitte alle Felder ausfüllen.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Das aktuelle Passwort ist falsch.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newHash, req.user.id);

  res.json({ message: 'Passwort erfolgreich geändert.' });
};
