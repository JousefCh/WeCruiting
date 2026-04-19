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

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cvs', require('./routes/cvs'));
app.use('/api/ai', require('./routes/ai'));

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
});
