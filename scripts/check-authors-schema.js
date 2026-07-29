const mysql = require('mysql2/promise');

async function test() {
  try {
    const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'promptking_db' });
    const [rows] = await c.query('SELECT * FROM authors LIMIT 3');
    console.log(rows);
    await c.end();
  } catch (e) {
    console.log(e.message);
  }
}
test();
