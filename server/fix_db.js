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
    
    console.log("Connecting to live DB to add sort_order column...");
    await pool.query('ALTER TABLE prompts ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0');
    console.log("Column added successfully!");
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
