import { randomBytes } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 — where the wallpaper files themselves live.
 *
 * Wallpapers are the heaviest thing this site serves: a 4K source is tens of
 * megabytes and every download ships the whole file. On object storage that
 * bills egress, a wallpaper that catches on is a bill; R2 charges nothing for
 * egress at all, which is the entire reason it is worth a second storage
 * provider in a codebase that already has one.
 *
 * The division of labour with Cloudinary is deliberate:
 *
 *   R2         the bytes — originals, uploaded once, downloaded forever
 *   cdn-cgi    the derivatives — resized, re-encoded at the edge on request
 *
 * See lib/wallpaperUrls.js for the second half. Nothing here is required: with
 * no R2 credentials configured the admin falls back to Cloudinary and the site
 * behaves exactly as it did before.
 */

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';

export const R2_BUCKET = process.env.R2_BUCKET || '';

/**
 * The hostname the public reads objects from — the bucket's custom domain
 * (https://cdn.example.com) or its r2.dev address.
 *
 * NEXT_PUBLIC_ because the browser builds image URLs from it too, and it is
 * not a secret: it is a public read endpoint by definition.
 */
export const R2_PUBLIC_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE || '').replace(/\/+$/, '');

const ENDPOINT = ACCOUNT_ID ? `https://${ACCOUNT_ID}.r2.cloudflarestorage.com` : '';

/** Whether uploads can be signed. False leaves every caller on Cloudinary. */
export const isR2Configured = () =>
  Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_BASE);

let client = null;

/**
 * Built on first use rather than at import.
 *
 * A module-level client would be constructed during the build, where the
 * credentials are not present, and the constructor throws on a missing key —
 * which would fail `next build` on a machine that has no R2 access and no need
 * for any.
 */
const r2 = () => {
  if (!client) {
    client = new S3Client({
      // R2 is single-region by design; the SDK still demands the field, and
      // 'auto' is what Cloudflare's own documentation signs with.
      region: 'auto',
      endpoint: ENDPOINT,
      // Path style, so every request goes to the account endpoint Cloudflare
      // shows in the dashboard. The SDK would otherwise fold the bucket into
      // the hostname, which is also supported by R2 — right up to the day
      // somebody names a bucket with a dot in it and the wildcard certificate
      // stops matching.
      forcePathStyle: true,
      credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
    });
  }
  return client;
};

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export const ALLOWED_UPLOAD_TYPES = Object.keys(EXTENSIONS);

/** 64 MB. Larger than any wallpaper worth publishing, small enough to be a wall. */
export const MAX_UPLOAD_BYTES = 64 * 1024 * 1024;

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/**
 * Where an upload lands.
 *
 * Dated prefix so a bucket with a few thousand objects still lists usefully in
 * the dashboard, and a random suffix because the key is permanent: re-uploading
 * a corrected file under the same title must not overwrite the one already
 * linked from a published page and sitting in Cloudflare's cache.
 */
export function buildObjectKey({ filename = '', contentType = '', title = '' } = {}) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  const fromName = slugify(String(filename).replace(/\.[a-z0-9]+$/i, ''));
  const stem = slugify(title) || fromName || 'wallpaper';

  const extFromName = String(filename).match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const ext = EXTENSIONS[contentType] || (extFromName && extFromName.length <= 4 ? extFromName : 'jpg');

  return `wallpapers/${year}/${month}/${stem}-${randomBytes(4).toString('hex')}.${ext}`;
}

/** The address the world reads an object from. */
export const publicUrl = (key) => `${R2_PUBLIC_BASE}/${String(key).replace(/^\/+/, '')}`;

/** The key inside a public URL, or null if the URL points somewhere else. */
export function keyFromPublicUrl(url) {
  if (!R2_PUBLIC_BASE) return null;
  const value = String(url || '');
  if (!value.startsWith(`${R2_PUBLIC_BASE}/`)) return null;
  const key = value.slice(R2_PUBLIC_BASE.length + 1).split('?')[0];
  return key ? decodeURIComponent(key) : null;
}

/**
 * A URL the browser may PUT one file to, once.
 *
 * The file never touches this server. That is not an optimisation: nginx in
 * front of the app caps request bodies at about a megabyte, so a wallpaper
 * posted to our own origin comes back 413 before any application code runs.
 * The same reasoning already sends Cloudinary uploads straight from the page.
 *
 * A presigned PUT cannot enforce a maximum size — only a POST policy can, and
 * R2 does not implement those. The size check therefore lives at the call site,
 * behind the admin guard, which is a guard against mistakes rather than
 * against an attacker who already holds an admin session.
 */
export async function presignUpload({ key, contentType, expiresIn = 600 }) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
    // Immutable by construction — buildObjectKey never reuses a key — so the
    // edge and the browser may both keep it forever.
    CacheControl: 'public, max-age=31536000, immutable',
  });
  return getSignedUrl(r2(), command, { expiresIn });
}

/**
 * A URL that saves the original file rather than displaying it.
 *
 * `download` on an anchor is ignored cross-origin, and a public R2 object
 * carries no Content-Disposition, so a plain link to the bucket opens the
 * wallpaper in a tab and leaves the visitor to long-press it. Presigning lets
 * the header be set per request without storing it on the object — where it
 * would force a download on every preview too.
 *
 * Short-lived because it is handed out by a redirect the browser follows
 * immediately; the link is spent by the time it could be shared.
 */
export async function presignDownload({ key, filename, expiresIn = 300 }) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${String(filename).replace(/["\\]/g, '')}"`,
  });
  return getSignedUrl(r2(), command, { expiresIn });
}

/** Removes an object. Used when a wallpaper row is deleted. */
export async function deleteObject(key) {
  if (!key) return;
  await r2().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

/**
 * Uploads bytes this server already holds — the "import from URL" path, where
 * the file is fetched here and forwarded rather than sent by the browser.
 */
export async function putObject({ key, body, contentType }) {
  await r2().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      // No ContentMD5 here. The SDK already attaches a CRC32 checksum to every
      // PutObject, and R2 rejects a request carrying two — "You can only
      // specify one non-default checksum at a time". The integrity check the
      // MD5 was there for is the one already being made.
    }),
  );
  return publicUrl(key);
}
