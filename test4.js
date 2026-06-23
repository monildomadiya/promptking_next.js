import db from './lib/db.js';

async function test() {
  const rows = await db`
        SELECT 
          DATE(created_at) AS \`date\`,
          SUM(CASE WHEN event_type = 'view'   THEN 1 ELSE 0 END) AS \`view\`,
          SUM(CASE WHEN event_type = 'copy'   THEN 1 ELSE 0 END) AS \`copy\`,
          SUM(CASE WHEN event_type = 'unlock' THEN 1 ELSE 0 END) AS \`unlock\`
        FROM analytics_events
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `;
  console.log("Analytics events rows:", rows);

  const [totals] = await db`
      SELECT
        COALESCE(SUM(view_count),   0) AS total_views,
        COALESCE(SUM(copy_count),   0) AS total_copies,
        COALESCE(SUM(unlock_count), 0) AS total_unlocks
      FROM prompts
    `;
  console.log("Totals from prompts:", totals);
  process.exit(0);
}
test();
