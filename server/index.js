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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
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
const sitemapRoute = require('./routes/sitemap');
app.use('/sitemap.xml', sitemapRoute);
app.use('/api/sitemap.xml', sitemapRoute);
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
    try {
      await db`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          prompt_key VARCHAR(100) NOT NULL,
          event_type ENUM('copy', 'unlock') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created_type (created_at, event_type)
        )
      `;
    } catch (e) {
      console.warn("Failed to check/add analytics_events:", e.message);
    }

    try {
      await db`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          action VARCHAR(255) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } catch (e) {
      console.warn("Failed to check/add activity_logs:", e.message);
    }

    try {
      const checkSort = await db`SHOW COLUMNS FROM prompts LIKE 'sort_order'`;
      if (checkSort.length === 0) {
        await db`ALTER TABLE prompts ADD COLUMN sort_order INT DEFAULT 0`;
      }
    } catch (e) {
      console.warn("Failed to check/add sort_order:", e.message);
    }

    try {
      const checkFeatured = await db`SHOW COLUMNS FROM prompts LIKE 'is_featured'`;
      if (checkFeatured.length === 0) {
        await db`ALTER TABLE prompts ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0`;
      }
    } catch (e) {
      console.warn("Failed to check/add is_featured:", e.message);
    }

    try {
      const checkMeta = await db`SHOW COLUMNS FROM prompts LIKE 'meta_title'`;
      if (checkMeta.length === 0) {
        await db`ALTER TABLE prompts ADD COLUMN meta_title VARCHAR(255) DEFAULT ''`;
      }
    } catch (e) {
      console.warn("Failed to check/add meta_title:", e.message);
    }

    try {
      const checkDraft = await db`SHOW COLUMNS FROM prompts LIKE 'is_draft'`;
      if (checkDraft.length === 0) {
        await db`ALTER TABLE prompts ADD COLUMN is_draft TINYINT(1) NOT NULL DEFAULT 0`;
      }
    } catch (e) {
      console.warn("Failed to check/add is_draft:", e.message);
    }

    try {
      const checkPublishDate = await db`SHOW COLUMNS FROM prompts LIKE 'publish_date'`;
      if (checkPublishDate.length === 0) {
        await db`ALTER TABLE prompts ADD COLUMN publish_date DATETIME DEFAULT NULL`;
      }
    } catch (e) {
      console.warn("Failed to check/add publish_date:", e.message);
    }

    try {
      await db`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } catch (e) {
      console.warn("Failed to check/add contact_messages:", e.message);
    }

    try {
      await db`
        CREATE TABLE IF NOT EXISTS authors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          image VARCHAR(255),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    } catch (e) {
      console.warn("Failed to check/add authors table:", e.message);
    }

    try {
      const checkAuthorId = await db`SHOW COLUMNS FROM blogs LIKE 'author_id'`;
      if (checkAuthorId.length === 0) {
        await db`ALTER TABLE blogs ADD COLUMN author_id INT NULL`;
      }
    } catch (e) {
      console.warn("Failed to check/add author_id to blogs:", e.message);
    }

    // Add all potentially missing columns to blogs table
    const blogColumns = [
      { name: 'author_id', def: 'INT NULL' },
      { name: 'author_name', def: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'author_image', def: 'VARCHAR(500) NULL DEFAULT NULL' },
      { name: 'author_description', def: 'TEXT NULL' },
      { name: 'read_time', def: 'VARCHAR(100) NULL DEFAULT NULL' },
      { name: 'focus_keyword', def: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'canonical_url', def: 'VARCHAR(500) NULL DEFAULT NULL' },
      { name: 'featured_image_alt', def: 'VARCHAR(500) NULL DEFAULT NULL' },
      { name: 'featured_image_caption', def: 'VARCHAR(500) NULL DEFAULT NULL' },
      { name: 'og_title', def: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'og_description', def: 'TEXT NULL' },
      { name: 'og_image', def: 'VARCHAR(500) NULL DEFAULT NULL' },
      { name: 'twitter_title', def: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'twitter_description', def: 'TEXT NULL' },
      { name: 'twitter_image', def: 'VARCHAR(500) NULL DEFAULT NULL' },
      { name: 'faqs', def: 'LONGTEXT NULL' },
      { name: 'enable_table_of_contents', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
      { name: 'status', def: "VARCHAR(50) NOT NULL DEFAULT 'published'" },
      { name: 'published_at', def: 'DATETIME NULL' },
      { name: 'slug', def: 'VARCHAR(500) NULL DEFAULT NULL' },
      { name: 'excerpt', def: 'TEXT NULL' },
      { name: 'category', def: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'tags', def: 'TEXT NULL' },
      { name: 'meta_title', def: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'meta_description', def: 'TEXT NULL' },
      { name: 'view_count', def: 'INT DEFAULT 0' },
    ];
    for (const col of blogColumns) {
      try {
        const exists = await db`SHOW COLUMNS FROM blogs LIKE ${col.name}`;
        if (exists.length === 0) {
          const mysql = require('mysql2/promise');
          const pool = mysql.createPool({
            host: process.env.DB_HOST, user: process.env.DB_USER,
            password: process.env.DB_PASS, database: process.env.DB_NAME,
            port: 3306, ssl: { rejectUnauthorized: false }
          });
          await pool.query(`ALTER TABLE blogs ADD COLUMN \`${col.name}\` ${col.def}`);
          await pool.end();
          console.log(`Added column: blogs.${col.name}`);
        }
      } catch (e) {
        console.warn(`Could not add column ${col.name}:`, e.message);
      }
    }

    console.log("Database tables initialized.");
  } catch (error) {
    console.error("Failed to initialize database tables:", error.message);
  }
})();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
