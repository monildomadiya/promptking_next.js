import db from './lib/db.js';
import { fetchAllData } from './lib/data.js';

async function test() {
  const data = await fetchAllData();
  const featured = data.prompts.filter(p => p.isFeatured).map(p => p.prompt_key);
  console.log('Featured keys from fetchAllData:', featured);
  
  const raw = await db`SELECT prompt_key, is_featured FROM prompts WHERE prompt_key IN ('PK7694', 'PK2628')`;
  console.log('Raw DB result:', raw);
  process.exit(0);
}
test();
