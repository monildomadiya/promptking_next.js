import { NextResponse, after } from 'next/server';
import {
  findProductForRedirect,
  getAffiliateSettings,
  recordAffiliateClick,
} from '@/lib/affiliate';
import { buildAffiliateUrl } from '@/lib/affiliateLinks';

export const dynamic = 'force-dynamic';

// Nothing here should ever be cached or indexed: the destination depends on
// the tag in settings, and every hit is a click we want to count.
const NO_STORE = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer-when-downgrade',
};

/**
 * Every "Buy" button on the site points here rather than at the store.
 *
 * That buys three things: a click count per product, the store tag applied at
 * click time (so changing it in Affiliate Setup re-tags every product), and
 * one place to retire a dead deal — an inactive or expired product sends the
 * visitor to /deals instead of to a 404 on somebody else's site.
 */
export async function GET(req, { params }) {
  const { slug } = await params;
  const fallback = new URL('/deals', req.url);

  let product = null;
  try {
    product = await findProductForRedirect(String(slug || '').slice(0, 191));
  } catch (error) {
    console.error('affiliate redirect lookup failed:', error.message);
  }

  const expired = product?.deal_ends_at && new Date(product.deal_ends_at) <= new Date();
  if (!product || !Number(product.is_active) || expired) {
    return NextResponse.redirect(fallback, { status: 302, headers: NO_STORE });
  }

  const settings = await getAffiliateSettings();
  const destination = buildAffiliateUrl(product, settings);
  if (!destination) {
    return NextResponse.redirect(fallback, { status: 302, headers: NO_STORE });
  }

  // Link-preview bots and prefetchers would otherwise inflate the numbers the
  // admin uses to decide what to feature.
  const ua = req.headers.get('user-agent') || '';
  const isBot = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype/i.test(ua);
  const isPrefetch = req.headers.get('purpose') === 'prefetch' || req.headers.get('sec-purpose')?.includes('prefetch');
  if (!isBot && !isPrefetch) {
    // After the response: the visitor is on their way to the store before the
    // counter query even starts.
    after(() => recordAffiliateClick(product.id));
  }

  return NextResponse.redirect(destination, { status: 302, headers: NO_STORE });
}
