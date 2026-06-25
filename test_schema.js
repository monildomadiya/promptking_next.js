const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env.local'});
async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  const [rows] = await connection.query('DESCRIBE website_categories');
  console.log(rows);
  await connection.end();
}
run().catch(console.error);
