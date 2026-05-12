require('dotenv').config();
const path = require('path');
const fs  = require('fs');

// ── PostgreSQL (production) ──────────────────────────────────────────────────
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  async function initPostgres() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        email      TEXT    NOT NULL UNIQUE,
        password   TEXT    NOT NULL,
        name       TEXT    NOT NULL,
        created_at TEXT    NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')),
        updated_at TEXT    NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE TABLE IF NOT EXISTS cvs (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title          TEXT    NOT NULL DEFAULT 'Mein Lebenslauf',
        cv_data        TEXT    NOT NULL DEFAULT '{}',
        thumbnail      TEXT,
        profile_number INTEGER UNIQUE,
        close_lead_id  TEXT,
        created_at     TEXT    NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')),
        updated_at     TEXT    NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token      TEXT    NOT NULL UNIQUE,
        expires_at TEXT    NOT NULL,
        used       INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE TABLE IF NOT EXISTS crm_candidates (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cv_id            INTEGER REFERENCES cvs(id) ON DELETE SET NULL,
        first_name       TEXT NOT NULL,
        last_name        TEXT NOT NULL DEFAULT '',
        email            TEXT,
        phone            TEXT,
        pipeline_stage   TEXT NOT NULL DEFAULT 'neu',
        current_position TEXT,
        current_company  TEXT,
        desired_salary   TEXT,
        notice_period    TEXT,
        location         TEXT,
        source           TEXT DEFAULT 'manuell',
        tags             TEXT DEFAULT '[]',
        notes            TEXT DEFAULT '',
        created_at       TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')),
        updated_at       TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE INDEX IF NOT EXISTS idx_crm_candidates_user ON crm_candidates(user_id);
      CREATE TABLE IF NOT EXISTS crm_companies (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name       TEXT NOT NULL,
        domain     TEXT,
        industry   TEXT,
        size       TEXT,
        city       TEXT,
        country    TEXT DEFAULT 'Deutschland',
        notes      TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')),
        updated_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE INDEX IF NOT EXISTS idx_crm_companies_user ON crm_companies(user_id);
      CREATE TABLE IF NOT EXISTS crm_contacts (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL,
        first_name TEXT NOT NULL,
        last_name  TEXT NOT NULL DEFAULT '',
        email      TEXT,
        phone      TEXT,
        position   TEXT,
        notes      TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')),
        updated_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE TABLE IF NOT EXISTS crm_jobs (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id  INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL,
        title       TEXT NOT NULL,
        description TEXT DEFAULT '',
        location    TEXT,
        salary_from INTEGER,
        salary_to   INTEGER,
        status      TEXT NOT NULL DEFAULT 'offen',
        priority    TEXT NOT NULL DEFAULT 'mittel',
        notes       TEXT DEFAULT '',
        created_at  TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')),
        updated_at  TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE INDEX IF NOT EXISTS idx_crm_jobs_user ON crm_jobs(user_id);
      CREATE TABLE IF NOT EXISTS crm_applications (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        candidate_id INTEGER NOT NULL REFERENCES crm_candidates(id) ON DELETE CASCADE,
        job_id       INTEGER NOT NULL REFERENCES crm_jobs(id) ON DELETE CASCADE,
        stage        TEXT NOT NULL DEFAULT 'beworben',
        notes        TEXT DEFAULT '',
        created_at   TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS')),
        updated_at   TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE TABLE IF NOT EXISTS crm_activities (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type TEXT NOT NULL,
        entity_id   INTEGER NOT NULL,
        type        TEXT NOT NULL DEFAULT 'notiz',
        content     TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
      CREATE INDEX IF NOT EXISTS idx_crm_activities_entity ON crm_activities(entity_type, entity_id);
      CREATE TABLE IF NOT EXISTS crm_tasks (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type TEXT,
        entity_id   INTEGER,
        title       TEXT NOT NULL,
        due_date    TEXT,
        completed   INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'))
      );
    `);
    console.log('PostgreSQL Datenbank initialisiert.');
  }

  initPostgres().catch(err => console.error('DB Init Fehler:', err.message));
  module.exports = pool;

// ── SQLite (local development fallback) ─────────────────────────────────────
} else {
  const Database = require('better-sqlite3');
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = new Database(path.join(dataDir, 'wecruiting.db'));

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cvs (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title          TEXT NOT NULL DEFAULT 'Mein Lebenslauf',
      cv_data        TEXT NOT NULL DEFAULT '{}',
      thumbnail      TEXT,
      profile_number INTEGER UNIQUE,
      close_lead_id  TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crm_candidates (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cv_id            INTEGER REFERENCES cvs(id) ON DELETE SET NULL,
      first_name       TEXT NOT NULL,
      last_name        TEXT NOT NULL DEFAULT '',
      email            TEXT,
      phone            TEXT,
      pipeline_stage   TEXT NOT NULL DEFAULT 'neu',
      current_position TEXT,
      current_company  TEXT,
      desired_salary   TEXT,
      notice_period    TEXT,
      location         TEXT,
      source           TEXT DEFAULT 'manuell',
      tags             TEXT DEFAULT '[]',
      notes            TEXT DEFAULT '',
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_crm_candidates_user ON crm_candidates(user_id);
    CREATE TABLE IF NOT EXISTS crm_companies (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      domain     TEXT,
      industry   TEXT,
      size       TEXT,
      city       TEXT,
      country    TEXT DEFAULT 'Deutschland',
      notes      TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_crm_companies_user ON crm_companies(user_id);
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL,
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL DEFAULT '',
      email      TEXT,
      phone      TEXT,
      position   TEXT,
      notes      TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crm_jobs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id  INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      location    TEXT,
      salary_from INTEGER,
      salary_to   INTEGER,
      status      TEXT NOT NULL DEFAULT 'offen',
      priority    TEXT NOT NULL DEFAULT 'mittel',
      notes       TEXT DEFAULT '',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_crm_jobs_user ON crm_jobs(user_id);
    CREATE TABLE IF NOT EXISTS crm_applications (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES crm_candidates(id) ON DELETE CASCADE,
      job_id       INTEGER NOT NULL REFERENCES crm_jobs(id) ON DELETE CASCADE,
      stage        TEXT NOT NULL DEFAULT 'beworben',
      notes        TEXT DEFAULT '',
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crm_activities (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      entity_id   INTEGER NOT NULL,
      type        TEXT NOT NULL DEFAULT 'notiz',
      content     TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_crm_activities_entity ON crm_activities(entity_type, entity_id);
    CREATE TABLE IF NOT EXISTS crm_tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type TEXT,
      entity_id   INTEGER,
      title       TEXT NOT NULL,
      due_date    TEXT,
      completed   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Add new columns to existing tables (ignore "duplicate column" errors)
  for (const sql of [
    'ALTER TABLE cvs ADD COLUMN profile_number INTEGER',
    'ALTER TABLE cvs ADD COLUMN close_lead_id TEXT',
  ]) {
    try { sqlite.exec(sql); } catch (e) {
      if (!e.message.includes('duplicate column')) throw e;
    }
  }

  console.log('SQLite Datenbank initialisiert (lokale Entwicklung).');

  function transformSQL(sql) {
    return sql
      .replace(/\$(\d+)/g, '?')
      .replace(/to_char\s*\(\s*NOW\s*\(\s*\)\s*,[^)]+\)/gi, "datetime('now')");
  }

  const pool = {
    query: async (sql, params = []) => {
      const s = transformSQL(sql);
      const isSelect = /^\s*(SELECT|WITH)/i.test(s);
      const hasReturning = /RETURNING/i.test(s);
      const stmt = sqlite.prepare(s);
      const args = params || [];
      if (isSelect || hasReturning) {
        const rows = stmt.all(...args);
        return { rows };
      } else {
        stmt.run(...args);
        return { rows: [] };
      }
    },
  };

  module.exports = pool;
}
