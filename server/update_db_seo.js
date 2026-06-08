const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env.local' });

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: 3306,
    });
    
    console.log("Connecting to live DB to add SEO columns...");

    const columnsToAdd = [
      "ADD COLUMN IF NOT EXISTS featured_image_alt VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS featured_image_caption VARCHAR(255)",
      "ADD COLUMN IF NOT EXISTS excerpt TEXT",
      "ADD COLUMN IF NOT EXISTS category VARCHAR(100)",
      "ADD COLUMN IF NOT EXISTS tags JSON",
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
      "ADD COLUMN IF NOT EXISTS enable_table_of_contents BOOLEAN DEFAULT TRUE",
      "ADD COLUMN IF NOT EXISTS author_name VARCHAR(100)",
      "ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published'",
      "ADD COLUMN IF NOT EXISTS published_at DATETIME",
      "ADD COLUMN IF NOT EXISTS read_time VARCHAR(50)"
    ];

    for (const col of columnsToAdd) {
      await pool.query(`ALTER TABLE blogs ${col}`);
      console.log(`Executed: ${col}`);
    }

    console.log("All columns added successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
