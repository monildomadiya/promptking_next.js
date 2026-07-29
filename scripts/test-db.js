const mysql = require('mysql2/promise');

async function test() {
  const configs = [
    { host: 'localhost', user: 'promptking_user', password: 'PromptKing@123', database: 'promptking_db' },
    { host: '127.0.0.1', user: 'promptking_user', password: 'PromptKing@123', database: 'promptking_db' },
    { host: 'localhost', user: 'root', password: '', database: 'promptking_db' },
    { host: 'localhost', user: 'root', password: 'root', database: 'promptking_db' },
  ];

  for (const cfg of configs) {
    try {
      const c = await mysql.createConnection(cfg);
      const [rows] = await c.query('SHOW TABLES');
      console.log(`✅ Connected as ${cfg.user}@${cfg.host}`);
      console.log('Tables:', rows.map(r => Object.values(r)[0]).join(', '));
      await c.end();
      return;
    } catch (e) {
      console.log(`❌ ${cfg.user}@${cfg.host}: ${e.message}`);
    }
  }
}
test();
