require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize DB on startup
require('./database/db');

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://we-cruiting.vercel.app',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Explicitly handle OPTIONS preflight
app.options('*', cors());
app.use(express.json({ limit: '15mb' })); // allow base64 photos
app.use(express.urlencoded({ extended: true }));

// Temp PDF files for Instantly attachments
const fs = require('fs');
const tempDir = path.join(__dirname, 'public/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
app.use('/temp', express.static(tempDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cvs', require('./routes/cvs'));
app.use('/api/cvs/:id', require('./routes/close'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/linkedin', require('./routes/linkedin'));
app.use('/api/placement', require('./routes/placement'));
app.use('/api/crm', require('./routes/crm'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve React SPA in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`WeCruiting Backend läuft auf Port ${PORT}`);
  console.log(`JWT_SECRET gesetzt: ${!!process.env.JWT_SECRET}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
  const key = process.env.ANTHROPIC_API_KEY || '';
  console.log(`ANTHROPIC_API_KEY: ${key.slice(0, 16)}... (Länge: ${key.length})`);
});
