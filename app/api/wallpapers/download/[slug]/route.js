import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { fetchWallpaperBySlug } from '@/lib/wallpapers';
import { DOWNLOAD_SIZES, buildDownloadUrl, parseCrop, cropToPixels } from '@/lib/wallpaperUrls';
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
 *   uncropped original   302 to a presigned R2 URL carrying the attachment
 *                        header. Browser talks to Cloudflare directly; this
 *                        server sends a few hundred bytes of redirect.
 *
 *   everything else      a crop, a resize, or both — R2 does neither — so the
 *                        object is read once and reshaped here with sharp,
 *                        then returned with a year-long immutable cache
 *                        header. Every input to the result is in the URL, so
 *                        a Cloudflare cache rule on this path turns each
 *                        distinct request into one origin fetch, ever.
 */
const CROPS = Object.fromEntries(
  Object.entries(DOWNLOAD_SIZES)
    .filter(([, spec]) => spec.w && spec.h)
    .map(([id, spec]) => [id, { width: spec.w, height: spec.h }]),
);

const filenameFor = (slug, size, cropped) => {
  const stem = String(slug || 'wallpaper').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  return `${stem || 'wallpaper'}-${size}${cropped ? '-crop' : ''}-promptking.jpg`;
};

export async function GET(req, { params }) {
  const { slug } = await params;
  const requested = req.nextUrl.searchParams.get('size') || 'original';
  const size = DOWNLOAD_SIZES[requested] ? requested : 'original';
  const crop = parseCrop(req.nextUrl.searchParams.get('crop'));

  const wallpaper = await fetchWallpaperBySlug(slug);
  if (!wallpaper) {
    return NextResponse.json({ error: 'No such wallpaper' }, { status: 404 });
  }

  const key = isR2Configured() ? keyFromPublicUrl(wallpaper.image) : null;

  // Not in the bucket — a wallpaper from the Cloudinary era, or an external
  // URL. buildDownloadUrl knows what to do with both, crop included, and
  // returns null for the ones that cannot be forced to download at all.
  if (!key) {
    const elsewhere = buildDownloadUrl(wallpaper.image, { size, slug: wallpaper.slug, crop });
    return NextResponse.redirect(elsewhere || wallpaper.image, 302);
  }

  const target = CROPS[size] || null;
  const filename = filenameFor(wallpaper.slug, size, Boolean(crop));

  try {
    // Nothing to do to the pixels: hand the whole object to Cloudflare and let
    // the browser fetch it from there.
    if (!crop && !target) {
      const signed = await presignDownload({ key, filename });
      return NextResponse.redirect(signed, 302);
    }

    // Read the object through a presigned URL rather than the S3 client: the
    // body arrives as a plain fetch stream, which is what sharp wants, and it
    // keeps the whole route on one code path for errors.
    const source = await presignDownload({ key, filename });
    const upstream = await fetch(source);
    if (!upstream.ok) throw new Error(`R2 returned ${upstream.status}`);

    const bytes = Buffer.from(await upstream.arrayBuffer());

    // .rotate() with no argument applies the EXIF orientation, and it has to
    // come first: .extract() works on the pixels as they stand at that point
    // in the pipeline, and the visitor drew their box on the image the way a
    // browser showed it — already turned the right way up.
    let pipeline = sharp(bytes).rotate();

    if (crop) {
      // metadata() reports the stored dimensions, which for orientations 5-8
      // are the turned ones. The crop fractions are measured against the image
      // as displayed, so swap them back before converting to pixels.
      const meta = await sharp(bytes).metadata();
      const turned = meta.orientation >= 5 && meta.orientation <= 8;
      const iw = turned ? meta.height : meta.width;
      const ih = turned ? meta.width : meta.height;
      pipeline = pipeline.extract(cropToPixels(crop, iw, ih));
    }

    if (target) {
      pipeline = pipeline.resize(target.width, target.height, {
        fit: 'cover',
        // With a crop the window is already the right shape and `centre` only
        // absorbs a rounding pixel. Without one there is a real choice to
        // make, and `attention` makes it by what is in the picture rather than
        // by its centre — the same bargain Cloudinary's g_auto strikes.
        position: crop ? 'centre' : sharp.strategy.attention,
      });
    }

    // jpeg, not the browser-friendly formats: this file is going to a phone's
    // wallpaper picker, which is the least format-tolerant software most
    // people own.
    const out = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(out.length),
        'Content-Disposition': `attachment; filename="${filename}"`,
        // The object key is immutable and the crop is spelled out in the
        // query, so this exact result is too.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('wallpaper download failed:', slug, size, error.message);
    return NextResponse.json({ error: 'Could not prepare that download' }, { status: 502 });
  }
}
