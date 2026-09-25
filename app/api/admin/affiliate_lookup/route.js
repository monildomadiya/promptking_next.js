export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  STORES,
  cleanProductUrl,
  detectStore,
  extractProductId,
  parseUrl,
} from '@/lib/affiliateLinks';

const MAX_HOPS = 5;
const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 9000;

// A desktop browser's headers. The stores serve bots a stripped page (or a
// captcha) and a real browser the full one with its structured data.
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
};

const KNOWN_HOSTS = Object.values(STORES).flatMap((s) => s.hosts);
const isKnownHost = (host) => KNOWN_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));

/**
 * Only ever the stores' own hosts, hop by hop. This runs on the server with
 * the server's network access, so "fetch whatever URL the form sent" would be
 * a way to make it read things it should not — an admin account is not a
 * reason to leave that open.
 */
async function fetchStorePage(startUrl) {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
    const url = parseUrl(current);
    if (!url || !isKnownHost(url.hostname.toLowerCase())) {
      return { finalUrl: current, html: null, status: 0, error: 'Link leads outside a supported store' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url.href, { headers: BROWSER_HEADERS, redirect: 'manual', signal: controller.signal, cache: 'no-store' });
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location'), url.href).href;
      continue;
    }

    if (!res.ok) return { finalUrl: url.href, html: null, status: res.status };

    const reader = res.body?.getReader();
    if (!reader) return { finalUrl: url.href, html: await res.text(), status: res.status };
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      chunks.push(value);
      if (size > MAX_BYTES) { reader.cancel().catch(() => {}); break; }
    }
    return { finalUrl: url.href, html: Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8'), status: res.status };
  }
  return { finalUrl: current, html: null, status: 0, error: 'Too many redirects' };
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", rsquo: '’', lsquo: '‘', ndash: '–', mdash: '—', hellip: '…', rupee: '₹' };
const decode = (s) => String(s || '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z0-9#]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
  .replace(/\s+/g, ' ')
  .trim();

const num = (s) => {
  if (s === null || s === undefined) return null;
  const n = Number(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const meta = (html, name) => {
  const re = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${name}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  return tag ? decode(tag.match(/content=["']([^"']*)["']/i)?.[1]) : null;
};

/** The first schema.org Product anywhere in the page's JSON-LD. */
function findJsonLdProduct(html) {
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const block of blocks) {
    const body = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    let data;
    try { data = JSON.parse(body); } catch { continue; }
    const queue = [data];
    while (queue.length) {
      const node = queue.shift();
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node)) { queue.push(...node); continue; }
      const type = [].concat(node['@type'] || []).map(String);
      if (type.includes('Product')) return node;
      if (node['@graph']) queue.push(node['@graph']);
    }
  }
  return null;
}

function fromJsonLd(product) {
  if (!product) return {};
  const offers = [].concat(product.offers || [])[0] || {};
  const image = [].concat(product.image || [])[0];
  const rating = product.aggregateRating || {};
  return {
    title: product.name ? decode(product.name) : null,
    description: product.description ? decode(product.description).slice(0, 400) : null,
    image_url: typeof image === 'string' ? image : image?.url || null,
    price: num(offers.price ?? offers.lowPrice),
    currency: offers.priceCurrency || null,
    rating: num(rating.ratingValue),
    review_count: num(rating.reviewCount ?? rating.ratingCount),
    brand: typeof product.brand === 'string' ? product.brand : product.brand?.name || null,
  };
}

/** Amazon's product page has no Product JSON-LD, so read the markup it does have. */
function fromAmazonMarkup(html) {
  const title = html.match(/id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1];
  const hiRes = html.match(/data-old-hires=["'](https:[^"']+)["']/i)?.[1]
    || html.match(/"hiRes":"(https:[^"]+)"/)?.[1]
    || html.match(/"large":"(https:[^"]+)"/)?.[1];
  const priceWhole = html.match(/class=["']a-price-whole["'][^>]*>([\d,]+)/i)?.[1];
  const priceToPay = html.match(/priceToPay[\s\S]{0,400}?a-offscreen["'][^>]*>([^<]+)</i)?.[1];
  const mrp = html.match(/a-price a-text-price[\s\S]{0,200}?a-offscreen["'][^>]*>([^<]+)</i)?.[1]
    || html.match(/M\.R\.P\.?:?[\s\S]{0,200}?a-offscreen["'][^>]*>([^<]+)</i)?.[1];
  const rating = html.match(/([0-5](?:\.\d)?) out of 5 stars/i)?.[1];
  const reviews = html.match(/id=["']acrCustomerReviewText["'][^>]*>([\d,]+)/i)?.[1];
  return {
    title: title ? decode(title) : null,
    image_url: hiRes || null,
    price: num(priceToPay) || num(priceWhole),
    mrp: num(mrp),
    rating: num(rating),
    review_count: num(reviews),
  };
}

/**
 * Flipkart shows the struck-through MRP only in markup, never in JSON-LD. It
 * is printed right after the selling price, so take the first rupee amount
 * after it that is plausibly an MRP for it — not a bank offer or an EMI line.
 */
function flipkartMrp(html, price) {
  if (!price) return null;
  const amounts = [...html.matchAll(/₹\s?([\d,]{2,})/g)].map((m) => num(m[1])).filter(Boolean);
  const at = amounts.indexOf(price);
  const after = at >= 0 ? amounts.slice(at + 1, at + 4) : amounts.slice(0, 6);
  return after.find((a) => a > price && a <= price * 6) || null;
}

const pick = (...values) => values.find((v) => v !== null && v !== undefined && v !== '') ?? null;

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let body;
  try { body = await req.json(); } catch { body = {}; }

  const url = parseUrl(body?.url);
  if (!url) return NextResponse.json({ error: 'Paste a product link first' }, { status: 400 });

  const store = detectStore(url.href);
  const base = {
    store,
    product_url: cleanProductUrl(url.href),
    external_id: extractProductId(url.href, store),
  };

  if (store === 'other') {
    // Not a store we know: nothing to fetch safely, but the link itself is fine.
    return NextResponse.json({ ...base, fetched: false, note: 'Store not recognised — fill the details in by hand.' });
  }

  let page;
  try {
    page = await fetchStorePage(url.href);
  } catch (error) {
    page = { html: null, status: 0, error: error.name === 'AbortError' ? 'The store took too long to answer' : error.message };
  }

  // A short link resolves to the real product page; keep that instead.
  const resolvedStore = detectStore(page.finalUrl || url.href);
  const resolved = resolvedStore !== 'other' ? page.finalUrl : url.href;
  const result = {
    ...base,
    store: resolvedStore !== 'other' ? resolvedStore : store,
    product_url: cleanProductUrl(resolved || url.href),
    external_id: extractProductId(resolved || url.href, resolvedStore) || base.external_id,
  };

  const html = page.html || '';
  const blocked = !html || /captcha|robot check|api-services-support@amazon/i.test(html.slice(0, 20000));

  if (blocked) {
    // Amazon in particular answers most servers with a captcha. The link,
    // store and ASIN are still worth having; the rest is a short form.
    const guess = result.store === 'amazon' && result.external_id
      ? `https://images-na.ssl-images-amazon.com/images/P/${result.external_id}.01._SCLZZZZZZZ_.jpg`
      : null;
    return NextResponse.json({
      ...result,
      image_url: guess,
      fetched: false,
      note: page.error
        || `${STORES[result.store].label} did not share the page details with the server (status ${page.status || 'blocked'}). The link is ready — add the title, image and price by hand.`,
    });
  }

  const ld = fromJsonLd(findJsonLdProduct(html));
  const amazon = result.store === 'amazon' ? fromAmazonMarkup(html) : {};
  const pageTitle = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1])
    .replace(/\s*[:|-]\s*(Amazon\.in|Flipkart\.com|Buy .*online.*)$/i, '')
    .replace(/^Buy\s+/i, '')
    .replace(/\s+Online at .*$/i, '');

  const price = pick(amazon.price, ld.price, num(meta(html, 'product:price:amount')), num(meta(html, 'og:price:amount')));
  let mrp = pick(amazon.mrp, result.store === 'flipkart' ? flipkartMrp(html, price) : null);
  if (mrp && price && mrp <= price) mrp = null;

  const found = {
    title: pick(amazon.title, ld.title, meta(html, 'og:title'), meta(html, 'twitter:title'), pageTitle),
    description: pick(ld.description, meta(html, 'og:description'), meta(html, 'description')),
    image_url: pick(amazon.image_url, ld.image_url, meta(html, 'og:image'), meta(html, 'twitter:image')),
    price,
    mrp,
    currency: pick(ld.currency, meta(html, 'product:price:currency')) || 'INR',
    rating: pick(amazon.rating, ld.rating),
    review_count: pick(amazon.review_count, ld.review_count),
    brand: ld.brand || null,
  };

  const filled = ['title', 'image_url', 'price'].filter((k) => found[k]).length;
  return NextResponse.json({
    ...result,
    ...found,
    fetched: filled > 0,
    note: filled === 3 ? null : 'Some details were not on the page — check the fields before saving.',
  });
}
