require('dotenv').config({path:'.env.local'});
const db = require('./db');

async function fix() {
  try {
    // First safely add the column using a try/catch since MySQL syntax can fail or it might already exist
    try {
      const check = await db`SHOW COLUMNS FROM prompts LIKE 'is_featured'`;
      if (check.length === 0) {
        console.log("Adding is_featured...");
        await db`ALTER TABLE prompts ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0`;
        console.log("is_featured added.");
      } else {
        console.log("is_featured already exists.");
      }
    } catch (err) {
      console.log("Error checking/adding is_featured:", err.message);
    }

    try {
      const check = await db`SHOW COLUMNS FROM prompts LIKE 'meta_title'`;
      if (check.length === 0) {
        console.log("Adding meta_title...");
        await db`ALTER TABLE prompts ADD COLUMN meta_title VARCHAR(255) DEFAULT ''`;
        console.log("meta_title added.");
      } else {
        console.log("meta_title already exists.");
      }
    } catch (err) {
      console.log("Error checking/adding meta_title:", err.message);
    }

    try {
      const check = await db`SHOW COLUMNS FROM prompts LIKE 'sort_order'`;
      if (check.length === 0) {
        console.log("Adding sort_order...");
        await db`ALTER TABLE prompts ADD COLUMN sort_order INT DEFAULT 0`;
        console.log("sort_order added.");
      } else {
        console.log("sort_order already exists.");
      }
    } catch (err) {
      console.log("Error checking/adding sort_order:", err.message);
    }
    
    console.log("Done checking tables.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fix();
