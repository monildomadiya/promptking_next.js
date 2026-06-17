require('dotenv').config();
const db = require('./lib/db');
(async () => {
  try {
    const rows = await db.default`DESCRIBE categories`;
    console.log(rows);
    const rows2 = await db.default`DESCRIBE prompts`;
    console.log(rows2);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
})();
