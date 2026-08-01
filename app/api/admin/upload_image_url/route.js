export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

/**
 * "Use image from URL" in the blog, category and listicle modals.
 *
 * All three have been posting here since they were written, with no route to
 * answer — every paste fell through to the `catch` and stored the third-party
 * URL directly, so those images loaded from someone else's server (and broke
 * whenever it moved them).
 *
 * Cloudinary fetches the URL itself; this server never requests it, so a pasted
 * link can't be used to probe the machine's own network.
 */
export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { url } = await req.json();

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Not a valid URL' }, { status: 400 });
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only http and https URLs can be imported' }, { status: 400 });
    }

    const result = await cloudinary.uploader.upload(parsed.href, {
      folder: 'promptking/images',
      resource_type: 'image',
    });

    return NextResponse.json({ status: 'success', imageUrl: result.secure_url });
  } catch (error) {
    console.error('upload_image_url error:', error);
    return NextResponse.json({ error: 'Could not fetch that image' }, { status: 500 });
  }
}
