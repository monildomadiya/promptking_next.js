import db from './lib/db.js';

async function seed() {
  await db`INSERT INTO analytics_events (event_type, item_key, created_at) VALUES 
    ('view', 'PK7694', NOW() - INTERVAL 2 DAY),
    ('view', 'PK7694', NOW() - INTERVAL 2 DAY),
    ('copy', 'PK7694', NOW() - INTERVAL 1 DAY),
    ('view', 'PK5931', NOW())`;
  
  await db`UPDATE prompts SET view_count = 3, copy_count = 1 WHERE prompt_key = 'PK7694'`;
  await db`UPDATE prompts SET view_count = 1 WHERE prompt_key = 'PK5931'`;

  console.log("Seeded test analytics events");
  process.exit(0);
}
seed();
