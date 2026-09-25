import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';
import { ensureAffiliateTables } from '@/lib/affiliate';
import {
  STORES,
  cleanProductUrl,
  detectStore,
  extractProductId,
  parseUrl,
} from '@/lib/affiliateLinks';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

/** Same collision rule as wallpapers: "boat-rockerz" becomes "boat-rockerz-2". */
const uniqueSlug = async (source, currentId = null) => {
  const base = slugify(source) || 'product';
  let candidate = base;
  let counter = 1;

  while (true) {
    const rows = currentId
      ? await db`SELECT id FROM affiliate_products WHERE slug = ${candidate} AND id != ${currentId}`
      : await db`SELECT id FROM affiliate_products WHERE slug = ${candidate}`;
    if (rows.length === 0) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
};

/** '' and garbage become NULL rather than 0: a product with no price shows none. */
const money = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

const whenOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await ensureAffiliateTables();
    const p = await req.json();

    const title = String(p.title || '').trim().slice(0, 255);
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const rawUrl = String(p.product_url || '').trim();
    if (!parseUrl(rawUrl)) {
      return NextResponse.json({ error: 'A valid product link is required' }, { status: 400 });
    }

    const customUrl = String(p.affiliate_url || '').trim();
    if (customUrl && !parseUrl(customUrl)) {
      return NextResponse.json({ error: 'The custom affiliate link is not a valid URL' }, { status: 400 });
    }

    const store = STORES[p.store] && p.store !== 'other' ? p.store : detectStore(rawUrl);
    const productUrl = cleanProductUrl(rawUrl);
    const externalId = String(p.external_id || '').trim() || extractProductId(rawUrl, store);
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : (String(p.tags || '').trim() || null);

    const price = money(p.price);
    const mrp = money(p.mrp);
    const rating = p.rating === '' || p.rating === null || p.rating === undefined
      ? null
      : Math.min(5, Math.max(0, Number(p.rating) || 0)) || null;
    const reviewCount = Number(String(p.review_count ?? '').replace(/[^0-9]/g, '')) || null;

    const slug = await uniqueSlug(String(p.slug || '').trim() || title, p.id || null);

    const fields = {
      slug,
      title,
      description: String(p.description || '').trim() || null,
      store,
      product_url: productUrl,
      affiliate_url: customUrl ? parseUrl(customUrl).href : null,
      external_id: externalId ? String(externalId).slice(0, 64) : null,
      image_url: String(p.image_url || '').trim() || null,
      price,
      mrp,
      currency: String(p.currency || 'INR').trim().toUpperCase().slice(0, 8) || 'INR',
      rating,
      review_count: reviewCount,
      badge: String(p.badge || '').trim().slice(0, 40) || null,
      category: String(p.category || '').trim().slice(0, 80) || null,
      tags,
      is_active: p.is_active === false || p.is_active === 0 ? 0 : 1,
      is_featured: p.is_featured ? 1 : 0,
      sort_order: Number(p.sort_order) || 0,
      deal_ends_at: whenOrNull(p.deal_ends_at),
    };

    if (p.id) {
      // price_updated_at only moves when the price does, so "Price as of"
      // on the site tells the truth about when it was last checked.
      const [before] = await db`SELECT price, mrp FROM affiliate_products WHERE id = ${p.id}`;
      if (!before) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      const priceChanged = Number(before.price || 0) !== Number(price || 0)
        || Number(before.mrp || 0) !== Number(mrp || 0)
        || p.price_checked;

      await db`
        UPDATE affiliate_products SET
          slug=${fields.slug}, title=${fields.title}, description=${fields.description},
          store=${fields.store}, product_url=${fields.product_url}, affiliate_url=${fields.affiliate_url},
          external_id=${fields.external_id}, image_url=${fields.image_url},
          price=${fields.price}, mrp=${fields.mrp}, currency=${fields.currency},
          rating=${fields.rating}, review_count=${fields.review_count}, badge=${fields.badge},
          category=${fields.category}, tags=${fields.tags}, is_active=${fields.is_active},
          is_featured=${fields.is_featured}, sort_order=${fields.sort_order},
          deal_ends_at=${fields.deal_ends_at}
        WHERE id=${p.id}
      `;
      if (priceChanged) {
        await db`UPDATE affiliate_products SET price_updated_at = NOW() WHERE id = ${p.id}`;
      }
    } else {
      await db`
        INSERT INTO affiliate_products
          (slug, title, description, store, product_url, affiliate_url, external_id, image_url,
           price, mrp, currency, rating, review_count, badge, category, tags,
           is_active, is_featured, sort_order, deal_ends_at, price_updated_at)
        VALUES
          (${fields.slug}, ${fields.title}, ${fields.description}, ${fields.store},
           ${fields.product_url}, ${fields.affiliate_url}, ${fields.external_id}, ${fields.image_url},
           ${fields.price}, ${fields.mrp}, ${fields.currency}, ${fields.rating}, ${fields.review_count},
           ${fields.badge}, ${fields.category}, ${fields.tags}, ${fields.is_active},
           ${fields.is_featured}, ${fields.sort_order}, ${fields.deal_ends_at}, NOW())
      `;
    }

    publishChanges('affiliateProducts');
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('save_affiliate_product error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
