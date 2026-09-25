export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  STORES,
  cleanProductUrl,
  detectStore,
  extractProductId,
  isShortLink,
  parseUrl,
} from '@/lib/affiliateLinks';

/**
 * Reads a pasted product link: which store, which product id, and the clean
 * link to store. Nothing more.
 *
 * This used to download the store's product page and pull the title, image,
 * price and rating out of it. That is scraping, and both stores forbid it:
 * Amazon's Conditions of Use bar "any robot, spider, scraper or other automated
 * means", and the Associates Operating Agreement allows product content only
 * through its Product Advertising API or SiteStripe. An affiliate account is
 * worth more than a filled-in form, so the details are now the admin's to add —
 * the modal says where to get each one legitimately.
 */
export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let body;
  try { body = await req.json(); } catch { body = {}; }

  const url = parseUrl(body?.url);
  if (!url) return NextResponse.json({ error: 'Paste a product link first' }, { status: 400 });

  const store = detectStore(url.href);
  const short = isShortLink(url.href);

  const notes = {
    amazon: short
      ? 'Amazon short link — it will be used exactly as it is.'
      : 'Amazon link ready. Copy the title and the image link from the SiteStripe bar on the product page (Get Link → Image). Price and rating are not shown on the site for Amazon products — Amazon only allows live prices from its API.',
    flipkart: short
      ? 'Flipkart short link — it will be used exactly as it is.'
      : 'Flipkart link ready. Add the title, image link and current price from the product page.',
    other: 'Store not recognised — the link will be used as it is. Fill the details in by hand.',
  };

  return NextResponse.json({
    store,
    product_url: cleanProductUrl(url.href),
    external_id: extractProductId(url.href, store),
    fetched: false,
    note: notes[store] || `${STORES[store]?.label || 'Store'} link ready. Add the title, image and price by hand.`,
  });
}
