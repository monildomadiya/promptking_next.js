require('dotenv').config({path: '.env.local'});
const db = require('./db');
const keys = ['PK001', 'PK002'];
const updates = keys.map((key, index) => db`UPDATE prompts SET sort_order = ${index} WHERE prompt_key = ${key}`);
Promise.all(updates).then(console.log).catch(console.error).finally(() => process.exit(0));
