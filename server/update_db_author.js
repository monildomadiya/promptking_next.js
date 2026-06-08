require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDbAuthor() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'promptking',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log("Adding new author columns to blogs table...");
    
    // Add columns one by one and ignore errors if they already exist
    const columns = [
      "ALTER TABLE blogs ADD COLUMN author_image VARCHAR(255) NULL AFTER author_name;",
      "ALTER TABLE blogs ADD COLUMN author_description TEXT NULL AFTER author_image;"
    ];

    for (let sql of columns) {
      try {
        await pool.query(sql);
        console.log("Success: " + sql);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log("Skipped (already exists): " + sql);
        } else {
          console.error("Error running: " + sql, e.message);
        }
      }
    }
    
    console.log("Database update completed successfully!");
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

updateDbAuthor();
