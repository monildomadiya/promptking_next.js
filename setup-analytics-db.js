require('dotenv').config({ path: '.env.local' });
const db = require('./lib/db');
(async () => {
  try {
    const res = await db.default`CREATE TABLE IF NOT EXISTS analytics_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      item_key VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    console.log("Table check/create successful");
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
})();
