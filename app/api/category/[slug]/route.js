import { NextResponse } from 'next/server';
import db from '@/lib/db';

const parseDbBool = (val) => {
  if (val === null || val === undefined) return false;
  if (Buffer.isBuffer(val)) return val[0] === 1;
  return val == 1 || val === true || val === 'true';
};

export async function GET(req, { params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  try {
    const cats = await db`SELECT * FROM website_categories WHERE slug = ${slug}`;
    if (cats.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    const category = cats[0];

    const rows = await db`SELECT * FROM prompts WHERE website_category_id = ${category.id} ORDER BY sort_order ASC, prompt_key ASC`;
    const prompts = rows.map(r => ({
      ...r,
      copy_count:       Number(r.copy_count || 0),
      unlock_count:     Number(r.unlock_count || 0),
      like_count:       Number(r.like_count || 0),
      view_count:       Number(r.view_count || 0),
      is_featured:      parseDbBool(r.is_featured),
      is_premium:       parseDbBool(r.is_premium)
    }));

    return NextResponse.json({ category, prompts });
  } catch (error) {
    console.error('API /category/[slug] ERROR:', error.message);
    return NextResponse.json({ error: "Failed to fetch category data" }, { status: 500 });
  }
}
