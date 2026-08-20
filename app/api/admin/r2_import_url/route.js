import { lookup } from 'dns/promises';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  isR2Configured,
  buildObjectKey,
  putObject,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from '@/lib/r2';

export const dynamic = 'force-dynamic';

/**
 * "Paste a URL" for wallpapers, when the bucket is the destination.
 *
 * The Cloudinary version of this hands the URL to Cloudinary and lets it do
 * the fetching, so this server never makes the request. R2 has no such fetch
 * API — the bytes have to come through here — which brings back the problem
 * that note was pleased to avoid: a pasted link is a request this machine
 * makes, and this machine can reach things the internet cannot.
 *
 * Hence the address check below. It is not airtight — a hostname can resolve
 * differently between this lookup and the fetch that follows — but it stops
 * the whole class of accidents, and the route is behind the admin guard, so
 * the remaining case is an admin pasting a link crafted to attack their own
 * server.
 */
const PRIVATE_V4 = [
  /^0\./, /^10\./, /^127\./, /^169\.254\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  // Carrier-grade NAT: not the public internet either.
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const isPrivateAddress = ({ address, family }) => {
  if (family === 6) {
    const v6 = address.toLowerCase();
    if (v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80')) return true;
    // ::ffff:10.0.0.1 and friends — a v4 address wearing a v6 hat.
    const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? PRIVATE_V4.some((re) => re.test(mapped[1])) : false;
  }
  return PRIVATE_V4.some((re) => re.test(address));
};

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (!isR2Configured()) {
    return NextResponse.json({ error: 'R2 is not configured on this server.' }, { status: 501 });
  }

  try {
    const { url, title = '' } = await req.json();

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Not a valid URL' }, { status: 400 });
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only http and https URLs can be imported' }, { status: 400 });
    }

    const addresses = await lookup(parsed.hostname, { all: true }).catch(() => []);
    if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
      return NextResponse.json({ error: 'That host cannot be imported from' }, { status: 400 });
    }

    const res = await fetch(parsed.href, { redirect: 'follow' });
    if (!res.ok) {
      return NextResponse.json({ error: `That URL answered ${res.status}` }, { status: 400 });
    }

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!ALLOWED_UPLOAD_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `That URL is not an image this site accepts (${contentType || 'unknown type'})` },
        { status: 400 },
      );
    }

    const body = Buffer.from(await res.arrayBuffer());
    if (body.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `That file is ${(body.length / 1048576).toFixed(1)} MB — the limit is ${MAX_UPLOAD_BYTES / 1048576} MB.` },
        { status: 413 },
      );
    }

    const key = buildObjectKey({ filename: parsed.pathname, contentType, title });
    const imageUrl = await putObject({ key, body, contentType });

    return NextResponse.json({ status: 'success', imageUrl, key });
  } catch (error) {
    console.error('r2_import_url error:', error.message);
    return NextResponse.json({ error: 'Could not fetch that image' }, { status: 500 });
  }
}
