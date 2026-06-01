const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

// Load .env.local first if it exists (local dev override), otherwise fall back to .env
const localEnvPath = path.join(__dirname, '.env.local');
const defaultEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath });
  console.log('[ENV] Loaded .env.local (LOCAL DEV MODE)');
} else {
  require('dotenv').config({ path: defaultEnvPath });
  console.log('[ENV] Loaded .env (PRODUCTION MODE)');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
let compression;
try {
  compression = require('compression');
} catch (e) {
  console.warn("Compression module not installed, skipping.");
}
if (compression) {
  app.use(compression());
}
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.set('trust proxy', 1);

const isProd = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: !!isProd, 
    sameSite: isProd ? 'none' : 'lax'
  }
}));

// --- HEALTH CHECK ---
app.get('/api/health-check', async (req, res) => {
  let dbStatus = "Checking...";
  let dbError = null;
  
  try {
    const db = require('./db');
    await db`SELECT 1`;
    dbStatus = "Connected";
  } catch (err) {
    dbStatus = "Failed";
    dbError = err.message;
  }
  
  res.json({
    status: "online",
    database: dbStatus,
    databaseError: dbError,
    dbType: "MySQL"
  });
});

// --- READ-ONLY GUARD (for local dev safety) ---
const READ_ONLY = process.env.READ_ONLY === 'true';
if (READ_ONLY) {
  app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      return res.status(403).json({ 
        error: 'READ_ONLY mode is active. Write operations are disabled in local dev to protect the live database.'
      });
    }
    next();
  });
  console.warn('⚠️  READ_ONLY mode is ACTIVE. All write operations are blocked.');
}

// Import and use routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Serve uploads static folder
app.use('/uploads', express.static('uploads'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('GLOBAL SERVER ERROR:', err);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    details: process.env.NODE_ENV === 'production' ? undefined : err.stack 
  });
});

// Initialize database tables
(async () => {
  try {
    const db = require('./db');
    await db`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prompt_key VARCHAR(100) NOT NULL,
        event_type ENUM('copy', 'unlock') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_type (created_at, event_type)
      )
    `;
    await db`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0`;
    console.log("Database tables initialized.");
  } catch (error) {
    console.error("Failed to initialize database tables:", error.message);
  }
})();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
