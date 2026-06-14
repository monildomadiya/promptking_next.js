
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    // Use SELECT * to be resilient against schema differences (e.g. missing 'id' column)
    const promptsRows = await db`SELECT * FROM prompts WHERE is_draft = 0 AND (publish_date IS NULL OR publish_date <= NOW()) ORDER BY sort_order ASC, prompt_key ASC`;
    const categoriesRows = await db`SELECT * FROM categories ORDER BY name ASC`;

    const parseDbBool = (val) => {
      if (val === null || val === undefined) return false;
      if (Buffer.isBuffer(val)) return val[0] === 1;
      return val == 1 || val === true || val === 'true';
    };

    const prompts = promptsRows.map(row => ({
      id: row.id ?? row.prompt_key,  // fallback to prompt_key if no id column
      title: row.title,
      sort_order: row.sort_order,
      isImageSlider: parseDbBool(row.is_image_slider),
      hidePromptBox: parseDbBool(row.hide_prompt_box),
      copyCount: Number(row.copy_count || 0),
      unlockCount: Number(row.unlock_count || 0),
      likeCount: Number(row.like_count || 0),
      viewCount: Number(row.view_count || 0),
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
      metaTitle: row.meta_title,
      is_draft: parseDbBool(row.is_draft),
      publish_date: row.publish_date
    }));

    const response = NextResponse.json({ prompts, likes: {}, categories: categoriesRows });
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('DATABASE ERROR:', error.message);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
