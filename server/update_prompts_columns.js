const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: 3306,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log("Connecting to DB...");

    const columnsToAdd = [
      "ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS meta_description TEXT",
      "ADD COLUMN IF NOT EXISTS focus_keyword VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS canonical_url VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS og_title VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS og_description TEXT",
      "ADD COLUMN IF NOT EXISTS og_image VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS twitter_title VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS twitter_description TEXT",
      "ADD COLUMN IF NOT EXISTS twitter_image VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS faqs JSON",
      "ADD COLUMN IF NOT EXISTS tags TEXT",
      "ADD COLUMN IF NOT EXISTS gallery_urls JSON",
      "ADD COLUMN IF NOT EXISTS hide_prompt_box BOOLEAN DEFAULT FALSE",
      "ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE",
      "ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE",
      "ADD COLUMN IF NOT EXISTS publish_date DATETIME"
    ];

    for (const col of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE prompts ${col}`);
        console.log(`Executed: ${col}`);
      } catch (err) {
        console.log(`Note on ${col}:`, err.message);
      }
    }

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
