const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const db = require('./server/db');

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
