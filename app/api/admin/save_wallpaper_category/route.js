import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** `slug` is UNIQUE, so resolve collisions here rather than surfacing a 500. */
const uniqueSlug = async (source, currentId = null) => {
  const base = slugify(source) || 'category';
  let candidate = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = currentId
      ? await db`SELECT id FROM wallpaper_categories WHERE slug = ${candidate} AND id != ${currentId}`
      : await db`SELECT id FROM wallpaper_categories WHERE slug = ${candidate}`;
    if (rows.length === 0) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
};

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const c = await req.json();
    if (!c.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = await uniqueSlug(c.slug?.trim() || c.name, c.id || null);

    if (c.id) {
      await db`
        UPDATE wallpaper_categories
        SET name=${c.name.trim()}, slug=${slug}, description=${c.description || null},
            sort_order=${Number(c.sort_order) || 0}
        WHERE id=${c.id}
      `;
    } else {
      await db`
        INSERT INTO wallpaper_categories (name, slug, description, sort_order)
        VALUES (${c.name.trim()}, ${slug}, ${c.description || null}, ${Number(c.sort_order) || 0})
      `;
    }

    // Both keys: the pill row is built from the categories cache, but its
    // counts are derived from the wallpaper listing, so leaving that one warm
    // would show a renamed category beside stale numbers.
    publishChanges('wallpaperCategories', 'wallpapers');
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('save_wallpaper_category error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
