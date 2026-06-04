require('dotenv').config({path: '.env.local'});
const db = require('./db');
db`SHOW COLUMNS FROM prompts`
  .then(cols => console.log(cols.map(c => c.Field)))
  .catch(console.error)
  .finally(() => process.exit(0));
