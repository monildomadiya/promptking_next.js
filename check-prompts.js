const db = require('./lib/db');
(async () => {
  try {
    const rows = await db`SELECT slug, prompt_key FROM prompts LIMIT 5`;
    console.log(rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
})();
