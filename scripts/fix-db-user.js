const mysql = require('mysql2/promise');

async function fix() {
  try {
    const c = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    
    await c.query(`CREATE USER IF NOT EXISTS 'promptking_user'@'localhost' IDENTIFIED BY 'PromptKing@123'`);
    await c.query(`GRANT ALL PRIVILEGES ON promptking_db.* TO 'promptking_user'@'localhost'`);
    await c.query(`FLUSH PRIVILEGES`);
    
    console.log('✅ promptking_user@localhost granted access to promptking_db');
    await c.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}
fix();
