import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  isR2Configured,
  buildObjectKey,
  presignUpload,
  publicUrl,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from '@/lib/r2';

export const dynamic = 'force-dynamic';

/**
 * Permission for one browser-to-R2 upload.
 *
 * The counterpart to /api/admin/upload_signature, which does the same job for
 * Cloudinary. Only a few hundred bytes of authorisation cross this origin; the
 * wallpaper goes straight from the admin's browser to Cloudflare, which is
 * what keeps it clear of nginx's 1 MB body limit and off this server's
 * bandwidth.
 *
 * The client is told the finished public URL up front. It has to be: R2's
 * response to a PUT is an empty 200 with an ETag, so there is nothing in it to
 * store on the row.
 */
export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 is not configured on this server.' },
      { status: 501 },
    );
  }

  try {
    const { filename = '', contentType = '', size = 0, title = '' } = await req.json();

    if (!ALLOWED_UPLOAD_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `That file type is not allowed (${contentType || 'unknown'}).` },
        { status: 400 },
      );
    }

    // Advisory: a presigned PUT carries no size limit of its own, so this
    // catches the wrong-file mistake rather than a determined admin.
    if (Number(size) > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `That file is ${(size / 1048576).toFixed(1)} MB — the limit is ${MAX_UPLOAD_BYTES / 1048576} MB.` },
        { status: 413 },
      );
    }

    const key = buildObjectKey({ filename, contentType, title });
    const uploadUrl = await presignUpload({ key, contentType });

    return NextResponse.json({
      key,
      uploadUrl,
      publicUrl: publicUrl(key),
      // Signed into the URL, so the PUT must send it back byte for byte.
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error('r2_upload_url error:', error.message);
    return NextResponse.json({ error: 'Could not authorise the upload' }, { status: 500 });
  }
}
