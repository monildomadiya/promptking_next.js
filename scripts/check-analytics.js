const mysql = require('mysql2/promise');
async function test() {
  try {
    const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'promptking_db' });
    const days = 30;
    const [rows] = await c.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as view,
        SUM(CASE WHEN event_type = 'copy' THEN 1 ELSE 0 END) as copy,
        SUM(CASE WHEN event_type = 'unlock' THEN 1 ELSE 0 END) as \`unlock\`
      FROM analytics_events
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `, [days]);
    console.log(rows);
    await c.end();
  } catch (e) {
    console.log(e.message);
  }
}
test();
