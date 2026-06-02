require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const connection = await pool.getConnection();
    console.log("Connected. Checking if is_featured exists...");
    
    // Check if column exists
    const [rows] = await connection.query("SHOW COLUMNS FROM prompts LIKE 'is_featured'");
    if (rows.length === 0) {
      console.log("Adding is_featured column...");
      await connection.query("ALTER TABLE prompts ADD COLUMN is_featured TINYINT(1) DEFAULT 0");
      console.log("Column added successfully.");
    } else {
      console.log("Column is_featured already exists.");
    }
    
    connection.release();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
