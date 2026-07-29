import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req, { params }) {
  const resolvedParams = await Promise.resolve(params);
  const key = decodeURIComponent(resolvedParams.key);

  try {
    const rows = await db`
      SELECT * FROM prompts 
      WHERE prompt_key = ${key} OR (slug = ${key} AND slug IS NOT NULL AND slug != '')
    `;
    if (rows.length === 0) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });

    const row = rows[0];
    
    const parseDbBool = (val) => {
      if (val === null || val === undefined) return false;
      if (Buffer.isBuffer(val)) return val[0] === 1;
      return val == 1 || val === true || val === 'true';
    };

    let selectedAuthor = null;
    if (row.author_id) {
      const specificAuthor = await db`SELECT * FROM authors WHERE id = ${row.author_id}`;
      if (specificAuthor.length > 0) selectedAuthor = specificAuthor[0];
    }
    
    if (!selectedAuthor) {
      const authors = await db`SELECT * FROM authors ORDER BY id ASC LIMIT 1`;
      selectedAuthor = authors.length > 0 ? authors[0] : null;
    }

    const prompt = {
      ...row,
      author_name: selectedAuthor?.name || 'PromptKing Admin',
      author_image: selectedAuthor?.image || 'https://promptking.in/favicon.png',
      author_description: selectedAuthor?.description || 'Passionate about AI and creative workflows. Exploring the frontiers of prompt engineering to help you unlock the true potential of tools like ChatGPT, Midjourney, and Gemini.',
      isImageSlider: parseDbBool(row.is_image_slider),
      copyCount: Number(row.copy_count),
      unlockCount: Number(row.unlock_count),
      likeCount: Number(row.like_count),
      viewCount: Number(row.view_count),
      aiType: row.ai_type,
      slug: row.slug,
      key: row.prompt_key,
      prompt_key: row.prompt_key,
      password: row.password,
      promptText: row.prompt_text,
      imgAfter: row.img_after,
      imgBefore: row.img_before,
      igLink: row.ig_link,
      imageRatio: row.image_ratio,
      galleryUrls: row.gallery_urls,
      isPremium: parseDbBool(row.is_premium),
      isFeatured: parseDbBool(row.is_featured),
      metaTitle: row.meta_title
    };
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('PROMPT ERROR:', error.message);
    return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 });
  }
}
