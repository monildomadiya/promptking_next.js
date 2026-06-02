const db = require('./server/db.js');
db`SELECT prompt_key, is_featured FROM prompts LIMIT 5`.then(console.log).catch(console.error).finally(() => process.exit());
