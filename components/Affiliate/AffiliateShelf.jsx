"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowRight, Info } from '@/components/Common/Icons';
import AffiliateProductCard, { productCardStyles } from '@/components/Affiliate/ProductCard';

const words = (value) => String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

/**
 * How well a product fits a page. A product's tags are the admin saying "show
 * me next to prompts about this", so a tag hit counts most; its category
 * turning up in the prompt's own words counts next; featured breaks ties.
 */
const score = (product, context) => {
  let s = 0;
  for (const tag of product.tags) {
    const t = tag.toLowerCase();
    if (context.tags.has(t)) s += 4;
    else if (context.text.includes(t)) s += 2;
  }
  if (product.category && words(product.category).some((w) => context.words.has(w))) s += 2;
  return s;
};

/**
 * "Recommended for this prompt": up to four products that match the page,
 * topped up with featured ones. Renders nothing at all when affiliate is off
 * in the admin, when it is off for prompt pages, or when there is nothing to show.
 */
export default function AffiliateShelf({ tags = [], title = '', aiType = '', limit = 4 }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get('/affiliate_products')
      .then((res) => { if (alive) setData(res.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const picks = useMemo(() => {
    if (!data?.enabled || !data.showOnPrompts || !data.products?.length) return [];
    const context = {
      tags: new Set(tags.map((t) => String(t).toLowerCase().trim())),
      text: `${title} ${aiType} ${tags.join(' ')}`.toLowerCase(),
      words: new Set(words(`${title} ${aiType} ${tags.join(' ')}`)),
    };
    const ranked = data.products
      .map((p) => ({ p, s: score(p, context) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || Number(b.p.isFeatured) - Number(a.p.isFeatured))
      .map((x) => x.p);
    const seen = new Set(ranked.map((p) => p.id));
    const fill = data.products.filter((p) => p.isFeatured && !seen.has(p.id));
    return [...ranked, ...fill].slice(0, limit);
  }, [data, tags, title, aiType, limit]);

  if (!picks.length) return null;

  return (
    <section className="pk-aff-shelf" aria-label={data.heading}>
      <style>{productCardStyles + shelfStyles}</style>
      <div className="pk-aff-shelf-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '24px', background: 'var(--accent-main)', borderRadius: '2px' }} />
          <h2>{data.heading}</h2>
        </div>
        <Link href="/deals" className="pk-aff-shelf-all">All deals <ArrowRight size={14} /></Link>
      </div>
      <div className="pk-aff-grid pk-aff-shelf-grid">
        {picks.map((p) => <AffiliateProductCard key={p.id} product={p} compact />)}
      </div>
      {data.disclosure && (
        <p className="pk-aff-disclosure" style={{ marginTop: '12px' }}>
          <Info size={13} style={{ marginTop: 2 }} /> <span>{data.disclosure}</span>
        </p>
      )}
    </section>
  );
}

const shelfStyles = `
.pk-aff-shelf { margin-top: 50px; padding-top: 40px; border-top: 1px solid rgba(0,0,0,0.08); }
.pk-aff-shelf-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.pk-aff-shelf-head h2 { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.3px; margin: 0; color: var(--text-main); }
.pk-aff-shelf-all {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  font-size: 0.82rem; font-weight: 800; color: var(--accent-main); text-decoration: none;
}
.pk-aff-shelf-grid { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
@media (max-width: 520px) {
  .pk-aff-shelf-head h2 { font-size: 1.25rem; }
  .pk-aff-shelf-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`;
