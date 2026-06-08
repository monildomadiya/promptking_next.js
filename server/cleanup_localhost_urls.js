require('dotenv').config();
const db = require('./db');

async function cleanupLocalhostUrls() {
  try {
    console.log("Cleaning up http://localhost:5000 from database...");

    // Update settings
    await db("UPDATE settings SET logo_url = REPLACE(logo_url, 'http://localhost:5000', '') WHERE logo_url LIKE '%http://localhost:5000%'");

    // Update authors
    await db("UPDATE authors SET image = REPLACE(image, 'http://localhost:5000', '') WHERE image LIKE '%http://localhost:5000%'");

    // Update blogs
    await db("UPDATE blogs SET featured_image = REPLACE(featured_image, 'http://localhost:5000', '') WHERE featured_image LIKE '%http://localhost:5000%'");
    await db("UPDATE blogs SET og_image = REPLACE(og_image, 'http://localhost:5000', '') WHERE og_image LIKE '%http://localhost:5000%'");
    await db("UPDATE blogs SET twitter_image = REPLACE(twitter_image, 'http://localhost:5000', '') WHERE twitter_image LIKE '%http://localhost:5000%'");
    await db("UPDATE blogs SET author_image = REPLACE(author_image, 'http://localhost:5000', '') WHERE author_image LIKE '%http://localhost:5000%'");
    await db("UPDATE blogs SET content = REPLACE(content, 'http://localhost:5000', '') WHERE content LIKE '%http://localhost:5000%'");

    // Update prompts
    await db("UPDATE prompts SET img_after = REPLACE(img_after, 'http://localhost:5000', '') WHERE img_after LIKE '%http://localhost:5000%'");

    console.log("Cleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanupLocalhostUrls();
