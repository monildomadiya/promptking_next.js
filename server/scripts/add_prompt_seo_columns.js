/**
 * Migration: Add SEO columns to prompts table
 * Run: node server/scripts/add_prompt_seo_columns.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const columns = [
  { name: 'meta_description',    def: 'TEXT' },
  { name: 'focus_keyword',       def: 'VARCHAR(255)' },
  { name: 'canonical_url',       def: 'VARCHAR(500)' },
  { name: 'og_title',            def: 'VARCHAR(255)' },
  { name: 'og_description',      def: 'TEXT' },
  { name: 'og_image',            def: 'VARCHAR(500)' },
  { name: 'twitter_title',       def: 'VARCHAR(255)' },
  { name: 'twitter_description', def: 'TEXT' },
  { name: 'twitter_image',       def: 'VARCHAR(500)' },
  { name: 'faqs',                def: 'TEXT' },
  { name: 'tags',                def: 'VARCHAR(1000)' },
];

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔧 Adding SEO columns to prompts table...');
  for (const col of columns) {
    try {
      await pool.query(`ALTER TABLE prompts ADD COLUMN \`${col.name}\` ${col.def}`);
      console.log(`  ✅ Added: ${col.name}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || (err.message && err.message.toLowerCase().includes('duplicate column'))) {
        console.log(`  ⏭️  Already exists: ${col.name}`);
      } else {
        console.error(`  ❌ Failed: ${col.name} — ${err.message}`);
      }
    }
  }
  console.log('✅ Migration complete.');
  await pool.end();
  process.exit(0);
}

run();
