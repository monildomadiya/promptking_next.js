import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { fetchWallpaperBySlug } from '@/lib/wallpapers';
import { DOWNLOAD_SIZES, buildDownloadUrl } from '@/lib/wallpaperUrls';
import { isR2Configured, keyFromPublicUrl, presignDownload } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/**
 * The save button for an R2-hosted wallpaper.
 *
 * Cloudinary needs nothing like this: `fl_attachment` sets Content-Disposition
 * at its own edge, so the button can be a plain cross-origin link. A public R2
 * object has no such header and cannot be given one per request, and an
 * anchor's `download` attribute is ignored across origins — so a direct link to
 * the bucket opens the wallpaper in a tab and leaves the visitor to long-press
 * it. This route is on the site's own origin, which makes the attribute work
 * and puts the filename under our control.
 *
 * What it does *not* do is become the path the bytes travel:
 *
 *   original          302 to a presigned R2 URL carrying the attachment
 *                     header. Browser talks to Cloudflare directly; this
 *                     server sends a few hundred bytes of redirect.
 *
 *   phone / desktop   these are crops, and R2 does not crop. Resized here with
 *                     sharp and returned with a year-long immutable cache
 *                     header, because the key never changes for a given
 *                     wallpaper and size — a Cloudflare cache rule on this
 *                     path turns it into one origin fetch per variant, ever.
 */
const CROPS = {
  phone: { width: DOWNLOAD_SIZES.phone.w, height: DOWNLOAD_SIZES.phone.h },
  desktop: { width: DOWNLOAD_SIZES.desktop.w, height: DOWNLOAD_SIZES.desktop.h },
};

const filenameFor = (slug, size) => {
  const stem = String(slug || 'wallpaper').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  return `${stem || 'wallpaper'}-${size}-promptking.jpg`;
};

export async function GET(req, { params }) {
  const { slug } = await params;
  const requested = req.nextUrl.searchParams.get('size') || 'original';
  const size = DOWNLOAD_SIZES[requested] ? requested : 'original';

  const wallpaper = await fetchWallpaperBySlug(slug);
  if (!wallpaper) {
    return NextResponse.json({ error: 'No such wallpaper' }, { status: 404 });
  }

  const key = isR2Configured() ? keyFromPublicUrl(wallpaper.image) : null;

  // Not in the bucket — a wallpaper from the Cloudinary era, or an external
  // URL. buildDownloadUrl knows what to do with both, and returns null for the
  // ones that cannot be forced to download at all.
  if (!key) {
    const elsewhere = buildDownloadUrl(wallpaper.image, { size, slug: wallpaper.slug });
    return NextResponse.redirect(elsewhere || wallpaper.image, 302);
  }

  const filename = filenameFor(wallpaper.slug, size);

  try {
    if (size === 'original') {
      const signed = await presignDownload({ key, filename });
      return NextResponse.redirect(signed, 302);
    }

    const { width, height } = CROPS[size];

    // Read the object through a presigned URL rather than the S3 client: the
    // body arrives as a plain fetch stream, which is what sharp wants, and it
    // keeps the whole route on one code path for errors.
    const source = await presignDownload({ key, filename });
    const upstream = await fetch(source);
    if (!upstream.ok) throw new Error(`R2 returned ${upstream.status}`);

    const resized = await sharp(Buffer.from(await upstream.arrayBuffer()))
      // `cover` with attention: crop to fill the frame, choosing the window by
      // what is in the picture rather than its centre — the same bargain
      // Cloudinary's g_auto strikes, so the crop matches the preview.
      .resize(width, height, { fit: 'cover', position: sharp.strategy.attention })
      // jpeg, not the browser-friendly formats: this file is going to a phone's
      // wallpaper picker, which is the least format-tolerant software most
      // people own.
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    return new NextResponse(resized, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(resized.length),
        'Content-Disposition': `attachment; filename="${filename}"`,
        // The object key is immutable, so this variant is too.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('wallpaper download failed:', slug, size, error.message);
    return NextResponse.json({ error: 'Could not prepare that download' }, { status: 502 });
  }
}
