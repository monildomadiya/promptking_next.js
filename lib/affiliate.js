import db from '@/lib/db';
import { cacheGet, cacheSet, CACHE_KEYS } from '@/lib/cache';
import { storeInfo, discountPercent, AMAZON_REQUIRED_STATEMENT } from '@/lib/affiliateLinks';

// Short enough that a deal with an end date disappears close to on time;
// admin writes call publishChanges('affiliateProducts') and drop it at once.
const PRODUCTS_TTL_MS = 60 * 1000;

/** Every site_settings key this feature reads, with the value used when unset. */
export const AFFILIATE_SETTING_DEFAULTS = {
  affiliate_enabled: '0',
  amazon_tag: '',
  flipkart_affid: '',
  flipkart_subid: '',
  affiliate_page_title: 'Deals & Gear We Recommend',
  affiliate_page_subtitle: 'Hand-picked products from Amazon, Flipkart and more — the tools, gadgets and gear that go with your AI creations.',
  affiliate_disclosure: 'As an Amazon Associate I earn from qualifying purchases. PromptKing also participates in the Flipkart Affiliate Programme. When you buy through these links we may earn a small commission, at no extra cost to you.',
  affiliate_show_on_prompts: '1',
  affiliate_prompt_heading: 'Recommended for this prompt',
  affiliate_show_in_nav: '1',
  affiliate_grid_count: '4',
};

const parseDbBool = (val) => {
  if (val === null || val === undefined) return false;
  if (Buffer.isBuffer(val)) return val[0] === 1;
  return val == 1 || val === true || val === 'true';
};

/**
 * The tables are created on first use rather than by a migration script: the
 * site has no migration runner, and a feature that 500s until someone runs SQL
 * by hand is a feature that looks broken on the day it ships.
 *
 * Kept on globalThis for the same reason lib/db.js keeps its pool there — route
 * handlers do not reliably share module instances.
 */
export function ensureAffiliateTables() {
  if (!globalThis.__pkAffiliateTables) {
    globalThis.__pkAffiliateTables = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS affiliate_products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          slug VARCHAR(191) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          store VARCHAR(20) NOT NULL DEFAULT 'other',
          product_url TEXT NOT NULL,
          affiliate_url TEXT NULL,
          external_id VARCHAR(64) NULL,
          image_url TEXT NULL,
          price DECIMAL(12,2) NULL,
          mrp DECIMAL(12,2) NULL,
          currency VARCHAR(8) NOT NULL DEFAULT 'INR',
          rating DECIMAL(2,1) NULL,
          review_count INT NULL,
          badge VARCHAR(40) NULL,
          category VARCHAR(80) NULL,
          tags TEXT NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          is_featured TINYINT(1) NOT NULL DEFAULT 0,
          sort_order INT NOT NULL DEFAULT 0,
          click_count INT NOT NULL DEFAULT 0,
          last_clicked_at DATETIME NULL,
          deal_ends_at DATETIME NULL,
          price_updated_at DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_affiliate_slug (slug),
          KEY idx_affiliate_listing (is_active, is_featured, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      // One row per product per day. A plain counter on the product answers
      // "how many clicks ever"; this answers "is it still earning", which is
      // the question that decides what to feature.
      await db`
        CREATE TABLE IF NOT EXISTS affiliate_clicks_daily (
          click_date DATE NOT NULL,
          product_id INT NOT NULL,
          clicks INT NOT NULL DEFAULT 0,
          PRIMARY KEY (click_date, product_id),
          KEY idx_affiliate_clicks_product (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `;
    })().catch((error) => {
      // Let the next call try again instead of caching the failure forever.
      globalThis.__pkAffiliateTables = null;
      throw error;
    });
  }
  return globalThis.__pkAffiliateTables;
}

/**
 * Affiliate settings, defaults filled in. Reads through the same cache
 * /api/settings fills, so a page render costs no extra query when it is warm.
 */
export async function getAffiliateSettings() {
  let all = cacheGet(CACHE_KEYS.settings);
  if (!all) {
    try {
      const keys = Object.keys(AFFILIATE_SETTING_DEFAULTS);
      const rows = await db`SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ${keys}`;
      all = {};
      rows.forEach((r) => { all[r.setting_key] = r.setting_value; });
    } catch (error) {
      console.error('getAffiliateSettings failed:', error.message);
      all = {};
    }
  }
  // A blank value falls back too: an admin who clears the page title should
  // get the default heading, not an empty <h1>.
  const out = {};
  for (const [key, fallback] of Object.entries(AFFILIATE_SETTING_DEFAULTS)) {
    const value = all[key];
    out[key] = value === undefined || value === null || value === '' ? fallback : String(value);
  }
  // Settings saved before the statement was part of the default still hold the
  // old wording in the database, so it is enforced here rather than trusted.
  if (!out.affiliate_disclosure.includes(AMAZON_REQUIRED_STATEMENT)) {
    out.affiliate_disclosure = `${AMAZON_REQUIRED_STATEMENT} ${out.affiliate_disclosure}`;
  }
  return out;
}

const splitTags = (value) => String(value || '').split(',').map((t) => t.trim()).filter(Boolean);

/**
 * Public shape: no raw links — every button goes through /go/<slug>.
 *
 * Amazon products go out with no price, MRP, discount or star rating. Amazon's
 * Associates policies allow prices only when fetched live from its Product
 * Advertising API, and star ratings only through that API — a price typed in
 * by hand is exactly the "static price" the programme terminates accounts for.
 * The admin can still keep the numbers for their own reference; they just
 * never reach a visitor. Flipkart has no such rule, so its prices stay.
 */
export const shapeProduct = (row) => {
  const isAmazon = row.store === 'amazon';
  const price = isAmazon || row.price === null || row.price === undefined ? null : Number(row.price);
  const mrp = isAmazon || row.mrp === null || row.mrp === undefined ? null : Number(row.mrp);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    store: row.store || 'other',
    storeLabel: storeInfo(row.store).label,
    image: row.image_url || null,
    price,
    mrp,
    currency: row.currency || 'INR',
    discount: discountPercent(price, mrp),
    rating: isAmazon || row.rating === null || row.rating === undefined ? null : Number(row.rating),
    reviewCount: !isAmazon && row.review_count ? Number(row.review_count) : null,
    badge: row.badge || null,
    category: row.category || null,
    tags: splitTags(row.tags),
    isFeatured: parseDbBool(row.is_featured),
    dealEndsAt: row.deal_ends_at ? new Date(row.deal_ends_at).toISOString() : null,
    priceUpdatedAt: row.price_updated_at
      ? new Date(row.price_updated_at).toISOString()
      : (row.updated_at ? new Date(row.updated_at).toISOString() : null),
  };
};

/**
 * Every product the public site may show: active, and not past its deal end.
 * Featured first, then the admin's order, then newest.
 */
export async function fetchAffiliateProducts() {
  const cached = cacheGet(CACHE_KEYS.affiliateProducts);
  if (cached) return cached;

  try {
    await ensureAffiliateTables();
    const rows = await db`
      SELECT id, slug, title, description, store, image_url, price, mrp, currency,
             rating, review_count, badge, category, tags, is_featured,
             deal_ends_at, price_updated_at, updated_at
      FROM affiliate_products
      WHERE is_active = 1
        AND (deal_ends_at IS NULL OR deal_ends_at > NOW())
      ORDER BY is_featured DESC, sort_order ASC, id DESC
    `;
    const products = rows.map(shapeProduct);
    cacheSet(CACHE_KEYS.affiliateProducts, products, PRODUCTS_TTL_MS);
    return products;
  } catch (error) {
    // A dead connection costs the shelf, never the page it sits on.
    console.error('fetchAffiliateProducts failed:', error.message);
    return [];
  }
}

/** The row /go/<slug> needs — including inactive ones, so it can say no. */
export async function findProductForRedirect(slug) {
  await ensureAffiliateTables();
  const [row] = await db`
    SELECT id, store, product_url, affiliate_url, is_active, deal_ends_at
    FROM affiliate_products WHERE slug = ${slug} LIMIT 1
  `;
  return row || null;
}

export async function recordAffiliateClick(productId) {
  try {
    await ensureAffiliateTables();
    await db`UPDATE affiliate_products SET click_count = click_count + 1, last_clicked_at = NOW() WHERE id = ${productId}`;
    await db`
      INSERT INTO affiliate_clicks_daily (click_date, product_id, clicks)
      VALUES (CURDATE(), ${productId}, 1)
      ON DUPLICATE KEY UPDATE clicks = clicks + 1
    `;
  } catch (error) {
    console.error('recordAffiliateClick failed:', error.message);
  }
}
