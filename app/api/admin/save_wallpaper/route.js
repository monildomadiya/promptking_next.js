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

/**
 * `wallpapers.slug` carries a UNIQUE key, so a collision here is a 500 from
 * MySQL rather than a message an admin can act on. Resolve it before the
 * insert: "sunset" becomes "sunset-2" the same way prompts do.
 */
const uniqueSlug = async (title, currentId = null) => {
  let base = slugify(title) || 'wallpaper';
  let candidate = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = currentId
      ? await db`SELECT id FROM wallpapers WHERE slug = ${candidate} AND id != ${currentId}`
      : await db`SELECT id FROM wallpapers WHERE slug = ${candidate}`;
    if (rows.length === 0) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
};

const ORIENTATIONS = new Set(['phone', 'desktop', 'both']);

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const w = await req.json();

    if (!w.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!w.image_url?.trim()) {
      return NextResponse.json({ error: 'An image is required' }, { status: 400 });
    }

    // Anything outside the enum is rejected by MySQL with a truncation error
    // that names the column and not the value, so normalise it here instead.
    const orientation = ORIENTATIONS.has(w.orientation) ? w.orientation : 'both';

    const slug = await uniqueSlug(w.slug?.trim() || w.title, w.id || null);
    const tags = Array.isArray(w.tags) ? w.tags.join(', ') : (w.tags || null);

    if (w.id) {
      await db`
        UPDATE wallpapers SET
          slug=${slug}, title=${w.title.trim()}, description=${w.description || null},
          image_url=${w.image_url.trim()}, orientation=${orientation},
          width=${w.width || null}, height=${w.height || null}, tags=${tags},
          prompt_key=${w.prompt_key || null}, category_id=${w.category_id || null},
          is_featured=${w.is_featured ? 1 : 0}, is_draft=${w.is_draft ? 1 : 0},
          sort_order=${Number(w.sort_order) || 0},
          meta_title=${w.meta_title || null}, meta_description=${w.meta_description || null},
          publish_date=${w.publish_date || null}
        WHERE id=${w.id}
      `;
    } else {
      await db`
        INSERT INTO wallpapers
          (slug, title, description, image_url, orientation, width, height, tags,
           prompt_key, category_id, is_featured, is_draft, sort_order, meta_title,
           meta_description, publish_date)
        VALUES
          (${slug}, ${w.title.trim()}, ${w.description || null}, ${w.image_url.trim()},
           ${orientation}, ${w.width || null}, ${w.height || null}, ${tags},
           ${w.prompt_key || null}, ${w.category_id || null}, ${w.is_featured ? 1 : 0},
           ${w.is_draft ? 1 : 0}, ${Number(w.sort_order) || 0}, ${w.meta_title || null},
           ${w.meta_description || null}, ${w.publish_date || null})
      `;
    }

    // The category pills and their counts are built from a separate cache, and
    // assigning a wallpaper to a category changes those counts — clearing only
    // the wallpaper listing would leave a category that has just gained its
    // first item still hidden from the row.
    publishChanges('wallpapers', 'wallpaperCategories');
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('save_wallpaper error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
