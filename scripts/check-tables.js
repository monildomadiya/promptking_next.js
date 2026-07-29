const mysql = require('mysql2/promise');
async function test() {
  try {
    const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'promptking_db' });
    const [rows] = await c.query('SHOW TABLES');
    console.log(rows);
    
    // Check if prompt_views exists
    const [cols] = await c.query('SHOW COLUMNS FROM prompt_views').catch(() => [[]]);
    console.log("prompt_views columns:", cols);
    
    await c.end();
  } catch (e) {
    console.log(e.message);
  }
}
test();
