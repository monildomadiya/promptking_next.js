require('dotenv').config();
const db = require('./db');

async function run() {
  try {
    const result = await db`DESCRIBE prompts`;
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
