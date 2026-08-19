import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Credentials for a browser-to-Cloudinary upload.
 *
 * Wallpapers are the largest files this site handles, and routing them through
 * the origin means they have to survive nginx's client_max_body_size — which
 * on this server is about 1 MB, so every real wallpaper came back 413 before
 * the application ever saw the request. Raising that limit needs shell access
 * to the box; this does not, and it is the better shape anyway: the file goes
 * straight from the browser to Cloudinary and never occupies the origin's
 * bandwidth or its event loop.
 *
 * Signed rather than unsigned: an unsigned preset is a world-writable inbox
 * for anyone who reads the page source. Here the secret stays on the server,
 * this route is behind the admin guard, and the signature it returns is good
 * for one upload into one folder.
 */
export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { api_key: apiKey, api_secret: apiSecret, cloud_name: cloudName } = cloudinary.config();

    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured on this server.' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'promptking/wallpapers';

    // Only the parameters Cloudinary folds into the signature belong here.
    // file, api_key and resource_type are excluded by the protocol, and
    // including one of them produces a signature the API rejects.
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

    return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
  } catch (error) {
    console.error('upload_signature error:', error.message);
    return NextResponse.json({ error: 'Could not sign the upload' }, { status: 500 });
  }
}
