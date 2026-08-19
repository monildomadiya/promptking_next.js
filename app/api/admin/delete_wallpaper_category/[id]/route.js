import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';

export async function DELETE(req, { params }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  try {
    // Clear the reference rather than delete the wallpapers. There is no FK
    // doing this for us, so without it the rows keep a category_id pointing at
    // nothing. The listing's LEFT JOIN means they'd still appear under "All",
    // which is the quiet version of this bug: a wallpaper that looks fine on
    // the site while carrying a dangling id that no admin screen can show or
    // fix. Nulling it puts them back in the uncategorised state the modal can
    // actually edit.
    await db`UPDATE wallpapers SET category_id = NULL WHERE category_id = ${id}`;
    await db`DELETE FROM wallpaper_categories WHERE id = ${id}`;

    publishChanges('wallpaperCategories', 'wallpapers');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wallpaper category error:', error.message);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
