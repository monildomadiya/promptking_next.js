require('dotenv').config();
require('dotenv').config();
const db = require('./db');

async function updateDbAuthorsTable() {
  try {
    console.log("Creating authors table and updating blogs table...");
    
    // 1. Create Authors Table
    const createAuthorsSql = `
      CREATE TABLE IF NOT EXISTS authors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await db(createAuthorsSql);
    console.log("Success: authors table created/verified.");

    // 2. Add author_id to blogs
    try {
      await db("ALTER TABLE blogs ADD COLUMN author_id INT NULL AFTER author_name;");
      console.log("Success: added author_id to blogs.");
    } catch (e) {
      if (e.message && e.message.includes('Duplicate column name')) {
        console.log("Skipped: author_id already exists in blogs.");
      } else if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Skipped: author_id already exists in blogs.");
      } else {
        throw e;
      }
    }

    // 3. Optional: Insert a default author if none exists
    const checkAuthors = await db("SELECT COUNT(*) as count FROM authors");
    if (checkAuthors[0].count === 0) {
      await db(`
        INSERT INTO authors (name, image, description) 
        VALUES ('PromptKing Admin', 'https://promptking.in/favicon.png', 'Passionate about AI and creative workflows. Exploring the frontiers of prompt engineering to help you unlock the true potential of tools like ChatGPT, Midjourney, and Gemini.')
      `);
      console.log("Success: Inserted default PromptKing Admin author.");
    }
    
    console.log("Database update completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

updateDbAuthorsTable();
