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
    const prompt = {
      ...row,
      isImageSlider: parseDbBool(row.is_image_slider),
      hidePromptBox: parseDbBool(row.hide_prompt_box),
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
