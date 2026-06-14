const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'promptking_user',
    password: 'PromptKing@123',
    database: 'promptking_db'
  });
  const [rows] = await c.query('SHOW TABLES');
  console.log(JSON.stringify(rows, null, 2));
  await c.end();
})().catch(e => console.error('Error:', e.message));
