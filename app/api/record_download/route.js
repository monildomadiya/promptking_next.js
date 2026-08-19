import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * Counts a wallpaper download.
 *
 * The file itself comes straight from Cloudinary, so this is the only moment
 * the origin hears about a download at all — which is also why it must never
 * block one. The client fires it alongside the download rather than before it,
 * and a failure here is logged and swallowed: a visitor who gets their
 * wallpaper and no counter increment is a far better outcome than the reverse.
 */
export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

    await db`
      UPDATE wallpapers
      SET download_count = COALESCE(download_count, 0) + 1
      WHERE slug = ${slug}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_download error:', error.message);
    return NextResponse.json({ error: 'Failed to record download' }, { status: 500 });
  }
}
