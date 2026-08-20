import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';
import { isR2Configured, keyFromPublicUrl, deleteObject } from '@/lib/r2';

export async function DELETE(req, { params }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  try {
    // Read before the delete: after it there is no row to find the file from,
    // and an orphaned 30 MB object is a bill nobody is looking at.
    const [row] = await db`SELECT image_url FROM wallpapers WHERE id=${id}`;

    await db`DELETE FROM wallpapers WHERE id=${id}`;

    // The row is what the site reads, so it goes first and the object after:
    // a failed delete in the bucket must not leave a wallpaper on the page
    // that the admin has already been told is gone.
    const key = isR2Configured() ? keyFromPublicUrl(row?.image_url) : null;
    if (key) {
      await deleteObject(key).catch((e) => console.error('R2 delete failed:', key, e.message));
    }

    // Also the category cache: deleting the last wallpaper in a category has
    // to drop that pill, and its counts live separately from the listing.
    publishChanges('wallpapers', 'wallpaperCategories');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wallpaper error:', error.message);
    return NextResponse.json({ error: 'Failed to delete wallpaper' }, { status: 500 });
  }
}
