const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
    console.log("Analytics table initialized.");
  } catch (error) {
    console.error("Failed to initialize analytics table:", error.message);
  }
})();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
