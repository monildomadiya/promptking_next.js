
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    let promptsRows;
    try {
      promptsRows = await db`SELECT id, prompt_key, title, ai_type, prompt_text, img_after, img_before, is_premium, is_featured, image_ratio, hide_prompt_box, password, ig_link, is_image_slider, sort_order, slug, copy_count, unlock_count, like_count, view_count, gallery_urls, meta_title, is_draft, publish_date FROM prompts WHERE is_draft = 0 AND (publish_date IS NULL OR publish_date <= NOW()) ORDER BY sort_order ASC, prompt_key ASC`;
    } catch (colErr) {
      if (colErr.message.includes('Unknown column')) {
        promptsRows = await db`SELECT * FROM prompts ORDER BY sort_order ASC, prompt_key ASC`;
      } else {
        throw colErr;
      }
    }
    const categoriesRows = await db`SELECT * FROM categories ORDER BY name ASC`;

    const parseDbBool = (val) => {
      if (val === null || val === undefined) return false;
      if (Buffer.isBuffer(val)) return val[0] === 1;
      return val == 1 || val === true || val === 'true';
    };

    const prompts = promptsRows.map(row => ({
      id: row.id,
      title: row.title,
      sort_order: row.sort_order,
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
