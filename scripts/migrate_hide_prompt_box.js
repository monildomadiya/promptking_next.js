require('dotenv').config();
const sql = require('../server/db');
(async () => {
  try {
    await sql`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS hide_prompt_box TINYINT(1) DEFAULT 0 AFTER password`;
    console.log('Migration complete: hide_prompt_box column added/ensured');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
