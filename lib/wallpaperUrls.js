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
 * Returns null for anything not served from Cloudinary — the `download`
 * attribute is ignored cross-origin, so a caller that rendered a button
 * regardless would be offering one that silently does nothing.
 */
export function buildDownloadUrl(imageUrl, { size = 'original', slug = 'wallpaper' } = {}) {
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
  if (!CLOUDINARY_UPLOAD_RE.test(String(imageUrl || ''))) return undefined;
  return widths.map((w) => `${cropUrl(imageUrl, { ...opts, width: w })} ${w}w`).join(', ');
}
