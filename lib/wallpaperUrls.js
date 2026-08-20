/**
 * Cloudinary URL construction for wallpapers — pure string work, no database.
 *
 * This lives apart from lib/wallpapers.js on purpose: that module imports the
 * mysql2 pool, and the grid and detail views are client components. Importing
 * the two from one file would pull a database driver into the browser bundle.
 */

/**
 * The sizes offered on a wallpaper page.
 *
 * `phone` and `desktop` are hard crops rather than fits: a wallpaper that
 * letterboxes is not a wallpaper. `g_auto` lets Cloudinary pick the crop
 * window by subject rather than centre, which matters most on the phone
 * ratio, where a landscape source loses most of its width.
 *
 * `original` is the untouched upload — the honest option when someone wants
 * the file for something other than a lock screen.
 */
export const DOWNLOAD_SIZES = {
  phone: { label: 'Phone', w: 1080, h: 1920, hint: '1080 × 1920' },
  desktop: { label: 'Desktop', w: 2560, h: 1440, hint: '2560 × 1440' },
  original: { label: 'Original', w: null, h: null, hint: 'Full resolution' },
};

const CLOUDINARY_UPLOAD_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload)\/(.+)$/;

/* ── Cloudflare R2 ─────────────────────────────────────────────────────────
 *
 * Wallpapers uploaded from now on live in R2 (see lib/r2.js); everything
 * already stored in Cloudinary keeps working untouched, which is why every
 * function below branches on the URL rather than on a setting.
 *
 * R2 stores bytes and does not transform them, so the derivatives come from
 * Cloudflare's image resizing at /cdn-cgi/image — same hostname as the bucket's
 * custom domain, so the source can be given as a plain path. That has to be
 * switched on for the zone (Images → Transformations), and until it is, the
 * URLs it produces do not resolve. Hence the flag: with it unset the grid falls
 * back to the full-size object, which is heavy but always correct.
 */
const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE || '').replace(/\/+$/, '');
const R2_TRANSFORMS = process.env.NEXT_PUBLIC_R2_TRANSFORMS === '1';

const isR2Url = (imageUrl) => Boolean(R2_BASE) && String(imageUrl || '').startsWith(`${R2_BASE}/`);

// Cloudinary's named quality steps, in the 1-100 Cloudflare wants. The gap
// between eco and good is roughly a third of the bytes on a photograph.
const CF_QUALITY = { eco: 65, good: 82, best: 92 };

/** `9:16` and a width of 540 → 960. */
const ratioHeight = (width, ratio) => {
  const [w, h] = String(ratio).split(':').map(Number);
  if (!w || !h) return null;
  return Math.round((width * h) / w);
};

/**
 * A Cloudflare-resized version of an object in the bucket.
 *
 * The source is written as a path rather than a full URL because it is on the
 * same hostname; a cross-zone source would need resizing "from any origin"
 * turned on as well, and one more thing to switch on is one more way for this
 * to return 404s in production.
 */
const cfImageUrl = (imageUrl, options) => {
  const path = String(imageUrl).slice(R2_BASE.length);
  return `${R2_BASE}/cdn-cgi/image/${options.filter(Boolean).join(',')}${path}`;
};

/** Filesystem-safe stem for the downloaded file. */
const downloadStem = (slug, size) => {
  const base = String(slug || 'wallpaper')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${base || 'wallpaper'}-${size}-promptking`;
};

/**
 * A URL that downloads rather than displays.
 *
 * Cloudinary's `fl_attachment` sets Content-Disposition at the CDN edge, so
 * the file never passes through this server — which is the whole reason the
 * download button is free to offer at any resolution. Piping bytes through a
 * route handler instead would put every download on the origin's bandwidth
 * bill and its event loop.
 *
 * Format is pinned to jpg rather than `f_auto`. Auto would hand modern
 * browsers an avif or webp, which is right for *displaying* an image and wrong
 * for one the visitor is about to set as a lock screen: phone wallpaper
 * pickers are the least format-tolerant software most people own.
 *
 * An R2-hosted wallpaper goes through this site instead — see the note on the
 * route below — and anything hosted somewhere else entirely returns null,
 * because the `download` attribute is ignored cross-origin and a button that
 * silently does nothing is worse than one that is visibly a plain link.
 */
export function buildDownloadUrl(imageUrl, { size = 'original', slug = 'wallpaper' } = {}) {
  /*
   * R2 objects are public but header-less: no Content-Disposition, so a direct
   * link opens the wallpaper in a tab, and `download` cannot fix that from
   * another origin. This route is on ours, which makes the attribute work
   * again; it also owns the filename and the resizing, and hands the original
   * straight back to Cloudflare as a redirect so the bytes never come through
   * here. See app/api/wallpapers/download/[slug]/route.js.
   */
  if (isR2Url(imageUrl)) {
    return `/api/wallpapers/download/${encodeURIComponent(slug)}?size=${encodeURIComponent(size)}`;
  }

  const match = String(imageUrl || '').match(CLOUDINARY_UPLOAD_RE);
  if (!match) return null;

  const [, prefix, rest] = match;
  const spec = DOWNLOAD_SIZES[size] || DOWNLOAD_SIZES.original;

  const parts = [];
  if (spec.w && spec.h) parts.push(`c_fill,g_auto,w_${spec.w},h_${spec.h}`);
  parts.push('q_auto:best', 'f_jpg', `fl_attachment:${downloadStem(slug, size)}`);

  return `${prefix}/${parts.join('/')}/${rest}`;
}

/** A display-sized variant for grids and previews (never a download). */
export function previewUrl(imageUrl, width = 600) {
  if (isR2Url(imageUrl)) {
    if (!R2_TRANSFORMS) return imageUrl;
    return cfImageUrl(imageUrl, [`width=${width}`, 'fit=scale-down', 'format=auto']);
  }

  const match = String(imageUrl || '').match(CLOUDINARY_UPLOAD_RE);
  if (!match) return imageUrl;
  const [, prefix, rest] = match;
  return `${prefix}/c_limit,w_${width}/q_auto,f_auto/${rest}`;
}

/**
 * A display variant: exact crop, exact width, cheap bytes.
 *
 * `c_limit` was the wrong tool for the cards. The grid shows a 3:4 box filled
 * with object-fit: cover, so a limit-scaled image arrives at the source's own
 * aspect ratio and the browser discards whatever does not fit — bytes paid for
 * and then cropped away. Asking Cloudinary for the 3:4 crop means every pixel
 * delivered is a pixel drawn.
 *
 * `q_auto:eco` rather than `q_auto` because these are thumbnails: at a couple
 * of hundred pixels the difference is invisible and roughly a third of the
 * weight. The full-size preview on a wallpaper's own page uses `good`, where
 * the image is the subject rather than a link target.
 */
export function cropUrl(imageUrl, { width, ratio = '3:4', quality = 'eco', format = 'auto' } = {}) {
  if (isR2Url(imageUrl)) {
    if (!R2_TRANSFORMS) return imageUrl;
    const height = ratio ? ratioHeight(width, ratio) : null;
    return cfImageUrl(imageUrl, [
      `width=${width}`,
      height && `height=${height}`,
      // gravity=auto is Cloudflare's subject detection, the counterpart of
      // Cloudinary's g_auto: on a 9:16 crop of a landscape source it is the
      // difference between a face and an elbow.
      height ? 'fit=cover,gravity=auto' : 'fit=scale-down',
      `format=${format}`,
      `quality=${CF_QUALITY[quality] || CF_QUALITY.good}`,
    ]);
  }

  const match = String(imageUrl || '').match(CLOUDINARY_UPLOAD_RE);
  if (!match) return imageUrl;
  const [, prefix, rest] = match;

  const transform = ratio
    ? `c_fill,g_auto,ar_${ratio},w_${width}`
    : `c_limit,w_${width}`;

  return `${prefix}/${transform}/q_auto:${quality},f_${format}/${rest}`;
}

/**
 * A srcset across the widths a layout can actually ask for.
 *
 * Without one, a single width has to serve both a 1x laptop and a 3x phone:
 * pick the small file and it is soft on the phone, pick the large one and the
 * laptop downloads several times the pixels it can display. The browser knows
 * its own density and viewport; this just gives it something to choose from.
 */
export function cropSrcSet(imageUrl, widths, opts = {}) {
  const cloudinary = CLOUDINARY_UPLOAD_RE.test(String(imageUrl || ''));
  // An R2 object with resizing switched off has exactly one size to offer, and
  // a srcset of five identical URLs would only invite the browser to pick the
  // largest candidate width and pay for a decode it did not need.
  const resizable = cloudinary || (isR2Url(imageUrl) && R2_TRANSFORMS);
  if (!resizable) return undefined;
  return widths.map((w) => `${cropUrl(imageUrl, { ...opts, width: w })} ${w}w`).join(', ');
}
