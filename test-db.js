const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing connection to: 147.182.131.30');
  try {
    const connection = await mysql.createConnection({
      host: '147.182.131.30',
      user: 'promptking_user',
      password: 'PromptKing@123',
      database: 'promptking_db',
      connectTimeout: 5000 // 5 seconds timeout
    });
    
    console.log('Connection successful!');
    const [rows] = await connection.execute('SHOW TABLES;');
    console.log('Tables in database:', rows.map(r => Object.values(r)[0]).join(', ') || 'No tables found.');
    
    await connection.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testConnection();
