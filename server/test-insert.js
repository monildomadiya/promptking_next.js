require('dotenv').config();
const db = require('./db');

async function testInsert() {
  try {
    console.log('Testing slug check...');
    // This is exactly what generateUniqueSlug does
    const rows = await db`
      SELECT prompt_key 
      FROM prompts 
      WHERE slug = ${'test-slug'} AND prompt_key != ${''}
    `;
    console.log('Slug check OK. Rows:', rows.length);
  } catch (e) {
    console.error('Slug check FAILED:', e.message);
  }

  try {
    console.log('\nTesting INSERT...');
    const testKey = 'PKTEST999';
    
    // Delete test record if exists
    await db`DELETE FROM prompts WHERE prompt_key = ${testKey}`;
    
    await db`
      INSERT INTO prompts (
        prompt_key, slug, title, description, ai_type, prompt_text, img_before, img_after, 
        ig_link, is_image_slider, image_ratio, password, is_premium, gallery_urls, hide_prompt_box, is_featured
      ) VALUES (
        ${testKey}, ${'test-prompt-999'}, ${'Test Prompt'}, ${'Test desc'}, 
        ${'ChatGPT'}, ${'Test prompt text'}, ${null}, ${null}, 
        ${null}, ${0}, ${'4 / 5'}, ${null}, ${0}, ${null}, ${0}, ${0}
      )
    `;
    console.log('INSERT OK!');
    
    // Cleanup
    await db`DELETE FROM prompts WHERE prompt_key = ${testKey}`;
    console.log('Cleanup OK');
  } catch (e) {
    console.error('INSERT FAILED:', e.message);
    console.error('Full error:', e);
  }
  
  process.exit(0);
}

testInsert();
