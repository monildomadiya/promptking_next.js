/**
 * Affiliate link handling that both the admin panel and the server need.
 *
 * No database import here on purpose: the product modal uses these to show the
 * admin, as they paste a link, which store it is and what the tagged link will
 * look like — and lib/affiliate.js uses the very same functions at redirect
 * time, so the preview can never disagree with what a visitor is sent to.
 */

/**
 * Every store the panel knows by name. `hosts` are matched as a suffix of the
 * link's hostname, so `www.amazon.in`, `m.amazon.in` and `amazon.in` are one
 * store. Short-link hosts (amzn.to, fkrt.it …) are listed with their store:
 * they are what the stores' own share buttons produce.
 */
export const STORES = {
  amazon: {
    label: 'Amazon',
    color: '#ff9900',
    ink: '#111827',
    hosts: ['amazon.in', 'amazon.com', 'amazon.co.uk', 'amazon.ae', 'amzn.to', 'amzn.in', 'amzn.eu', 'a.co'],
    shortHosts: ['amzn.to', 'amzn.in', 'amzn.eu', 'a.co'],
  },
  flipkart: {
    label: 'Flipkart',
    color: '#2874f0',
    ink: '#ffffff',
    hosts: ['flipkart.com', 'fkrt.it', 'fkrt.cc', 'fktr.in'],
    shortHosts: ['fkrt.it', 'fkrt.cc', 'fktr.in'],
  },
  myntra: { label: 'Myntra', color: '#ff3f6c', ink: '#ffffff', hosts: ['myntra.com', 'myntr.it'], shortHosts: ['myntr.it'] },
  ajio: { label: 'AJIO', color: '#2c4152', ink: '#ffffff', hosts: ['ajio.com', 'ajiio.in'], shortHosts: ['ajiio.in'] },
  meesho: { label: 'Meesho', color: '#9f2089', ink: '#ffffff', hosts: ['meesho.com'], shortHosts: [] },
  croma: { label: 'Croma', color: '#12daa8', ink: '#0b1320', hosts: ['croma.com'], shortHosts: [] },
  nykaa: { label: 'Nykaa', color: '#fc2779', ink: '#ffffff', hosts: ['nykaa.com', 'nykaafashion.com'], shortHosts: [] },
  other: { label: 'Store', color: '#475569', ink: '#ffffff', hosts: [], shortHosts: [] },
};

export const STORE_IDS = Object.keys(STORES);

/**
 * The sentence the Amazon Associates Operating Agreement requires, word for
 * word, "clearly and prominently" on the site. Kept out of the editable
 * disclosure's reach: rewording that text must never be able to delete the one
 * line whose absence can close the account.
 */
export const AMAZON_REQUIRED_STATEMENT = 'As an Amazon Associate I earn from qualifying purchases.';

export const storeInfo = (id) => STORES[id] || STORES.other;

const hostMatches = (host, list) => list.some((h) => host === h || host.endsWith(`.${h}`));

/** `new URL` that forgives a missing scheme and never throws. */
export function parseUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return /^https?:$/.test(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

/** Which store a link belongs to, or 'other'. */
export function detectStore(raw) {
  const url = parseUrl(raw);
  if (!url) return 'other';
  const host = url.hostname.toLowerCase();
  for (const id of STORE_IDS) {
    if (hostMatches(host, STORES[id].hosts)) return id;
  }
  return 'other';
}

/** amzn.to / fkrt.it style links: already tagged by whoever made them, and opaque. */
export function isShortLink(raw) {
  const url = parseUrl(raw);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  // Flipkart's app share button makes dl.flipkart.com/s/<code> — a short link
  // on the store's own domain.
  if (hostMatches(host, ['flipkart.com']) && /^\/s\//.test(url.pathname)) return true;
  return STORE_IDS.some((id) => hostMatches(host, STORES[id].shortHosts));
}

/** The ten-character product id in any of the shapes Amazon's URLs take. */
export function extractAsin(raw) {
  const url = parseUrl(raw);
  if (!url) return null;
  const match = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/asin|o\/asin)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return match ? match[1].toUpperCase() : null;
}

/** Flipkart keeps the product id in `pid`; the item id is the fallback. */
export function extractFlipkartPid(raw) {
  const url = parseUrl(raw);
  if (!url) return null;
  const pid = url.searchParams.get('pid');
  if (pid) return pid.toUpperCase();
  const item = url.pathname.match(/\/p\/(itm[a-z0-9]+)/i);
  return item ? item[1] : null;
}

export function extractProductId(raw, store = detectStore(raw)) {
  if (store === 'amazon') return extractAsin(raw);
  if (store === 'flipkart') return extractFlipkartPid(raw);
  return null;
}

// Tracking and session junk the stores append to every shared link. None of
// it is needed to open the product, and some of it (Amazon's `tag`, Flipkart's
// `affid`) is somebody else's affiliate id that would win over ours.
const JUNK_PARAMS = [
  /^utm_/i, /^pf_rd_/i, /^pd_rd_/i, /^ref_?$/i, /^_encoding$/i, /^psc$/i, /^th$/i, /^smid$/i,
  /^content-id$/i, /^linkcode$/i, /^linkid$/i, /^creative(asin)?$/i, /^camp$/i, /^ascsubtag$/i,
  /^tag$/i, /^qid$/i, /^sr$/i, /^keywords$/i, /^crid$/i, /^sprefix$/i, /^dib(_tag)?$/i,
  /^affid$/i, /^affextparam\d$/i, /^lid$/i, /^marketplace$/i, /^store$/i, /^srno$/i,
  /^otracker\d?$/i, /^fm$/i, /^iid$/i, /^ppt$/i, /^ppn$/i, /^ssid$/i, /^spotlighttagid$/i, /^cmpid$/i,
];

/**
 * The shortest link that still opens the product, with no one's affiliate id
 * on it. This is what gets stored: the tag is added at click time, so changing
 * the tag in settings re-tags every product at once.
 */
export function cleanProductUrl(raw) {
  const url = parseUrl(raw);
  if (!url) return String(raw || '').trim();
  const store = detectStore(url.href);
  if (isShortLink(url.href)) return url.href;

  if (store === 'amazon') {
    const asin = extractAsin(url.href);
    // /dp/ASIN is Amazon's own canonical form; the slug before it is decoration.
    if (asin) return `https://${url.hostname}/dp/${asin}`;
  }

  if (store === 'flipkart') {
    const pid = url.searchParams.get('pid');
    // Product pages live on www; any other path keeps the host it came with.
    const host = url.pathname.includes('/p/') ? 'www.flipkart.com' : url.hostname;
    const clean = new URL(`https://${host}${url.pathname}`);
    if (pid) clean.searchParams.set('pid', pid);
    return clean.href;
  }

  for (const key of [...url.searchParams.keys()]) {
    if (JUNK_PARAMS.some((re) => re.test(key))) url.searchParams.delete(key);
  }
  url.hash = '';
  return url.href;
}

/**
 * The link a visitor is actually sent to.
 *
 * Order of precedence:
 *   1. a link the admin pasted into "Custom affiliate link" — used verbatim
 *      (EarnKaro, Cuelinks, an amzn.to from SiteStripe …)
 *   2. a short link — it already carries whoever made it's tag, and cannot be
 *      re-tagged without resolving it
 *   3. the product link with the store's tag from Affiliate Setup
 *
 * @param {{ store?: string, product_url?: string, affiliate_url?: string }} product
 * @param {{ amazon_tag?: string, flipkart_affid?: string, flipkart_subid?: string }} settings
 */
export function buildAffiliateUrl(product, settings = {}) {
  const custom = String(product?.affiliate_url || '').trim();
  if (custom && parseUrl(custom)) return parseUrl(custom).href;

  const raw = product?.product_url;
  const url = parseUrl(raw);
  if (!url) return null;
  if (isShortLink(url.href)) return url.href;

  const store = product?.store && STORES[product.store] ? product.store : detectStore(url.href);
  const tagged = new URL(cleanProductUrl(url.href));

  if (store === 'amazon' && settings.amazon_tag?.trim()) {
    tagged.searchParams.set('tag', settings.amazon_tag.trim());
    // Amazon's own links carry these two; reports attribute more reliably with them.
    tagged.searchParams.set('linkCode', 'll1');
    tagged.searchParams.set('language', 'en_IN');
  }

  if (store === 'flipkart' && settings.flipkart_affid?.trim()) {
    tagged.searchParams.set('affid', settings.flipkart_affid.trim());
    if (settings.flipkart_subid?.trim()) tagged.searchParams.set('affExtParam1', settings.flipkart_subid.trim());
  }

  return tagged.href;
}

/** Whole-percent discount, or 0 when there is nothing honest to show. */
export function discountPercent(price, mrp) {
  const p = Number(price);
  const m = Number(mrp);
  if (!p || !m || m <= p) return 0;
  return Math.round(((m - p) / m) * 100);
}

const INR = typeof Intl !== 'undefined'
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  : null;

export function formatPrice(value, currency = 'INR') {
  const n = Number(value);
  if (!n) return '';
  if (currency === 'INR' && INR) return INR.format(n);
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n}`;
  }
}
