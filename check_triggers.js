const db = require('./lib/db.js').default;

(async () => {
  try {
    const triggers = await db`SHOW TRIGGERS LIKE 'prompts'`;
    console.log(triggers);
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
})();
