"use client";

import React, { useState } from 'react';
import { ExternalLink, Star, Clock } from '@/components/Common/Icons';
import { storeInfo, formatPrice } from '@/lib/affiliateLinks';

/** "Ends in 2d", "Ends in 5h" — or nothing once it is far enough away not to matter. */
const endsIn = (iso) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!(ms > 0)) return null;
  const hours = Math.floor(ms / 3600000);
  if (hours >= 24 * 7) return null;
  if (hours >= 24) return `Ends in ${Math.floor(hours / 24)}d`;
  if (hours >= 1) return `Ends in ${hours}h`;
  return 'Ending soon';
};

/**
 * One product, linking out through /go/<slug>.
 *
 * `rel="sponsored"` is what Google asks for on paid links, and it is also what
 * the stores' programme terms expect — the link is an advertisement, and the
 * markup says so.
 */
export default function AffiliateProductCard({ product, compact = false }) {
  const store = storeInfo(product.store);
  const deadline = endsIn(product.dealEndsAt);
  // Store CDNs retire image URLs; a dead one falls back to the store's name
  // rather than a broken-image icon with alt text spilling over the badges.
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = product.image && failedSrc !== product.image;

  return (
    <a
      href={`/go/${product.slug}`}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={`pk-aff-card ${compact ? 'is-compact' : ''}`}
      style={{ '--pk-store': store.color, '--pk-store-ink': store.ink }}
    >
      <span className="pk-aff-thumb">
        {showImage ? (
          <img src={product.image} alt={product.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedSrc(product.image)} />
        ) : (
          <span className="pk-aff-noimg">{store.label}</span>
        )}
        <span className="pk-aff-store">{store.label}</span>
        {product.discount > 0 && <span className="pk-aff-off">{product.discount}% off</span>}
      </span>

      <span className="pk-aff-body">
        {(product.badge || deadline) && (
          <span className="pk-aff-flags">
            {product.badge && <span className="pk-aff-badge">{product.badge}</span>}
            {/* Relative to "now", which the cached server render and the
                browser disagree on by up to a minute — or an hour. */}
            {deadline && <span className="pk-aff-deadline" suppressHydrationWarning><Clock size={11} /> {deadline}</span>}
          </span>
        )}
        <span className="pk-aff-title">{product.title}</span>

        {product.rating ? (
          <span className="pk-aff-rating">
            <Star size={12} fill="#f59e0b" color="#f59e0b" /> {product.rating.toFixed(1)}
            {product.reviewCount ? <em>({product.reviewCount.toLocaleString('en-IN')})</em> : null}
          </span>
        ) : null}

        <span className="pk-aff-price">
          {product.price ? <strong>{formatPrice(product.price, product.currency)}</strong> : <strong className="is-check">Check price</strong>}
          {product.mrp && product.discount > 0 ? <s>{formatPrice(product.mrp, product.currency)}</s> : null}
        </span>

        <span className="pk-aff-cta">
          Buy on {store.label} <ExternalLink size={13} />
        </span>
      </span>
    </a>
  );
}

export const productCardStyles = `
.pk-aff-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
.pk-aff-card {
  display: flex; flex-direction: column; min-width: 0;
  border-radius: 20px; overflow: hidden; text-decoration: none; color: var(--text-main);
  background: var(--surface-0); border: 1px solid var(--border-color);
  transition: transform 0.28s cubic-bezier(0.4,0,0.2,1), border-color 0.28s ease;
}
@media (hover: hover) {
  .pk-aff-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--pk-store) 55%, transparent); }
  .pk-aff-card:hover .pk-aff-thumb img { transform: scale(1.05); }
  .pk-aff-card:hover .pk-aff-cta { background: var(--pk-store); color: var(--pk-store-ink); border-color: var(--pk-store); }
}
.pk-aff-thumb {
  position: relative; display: flex; align-items: center; justify-content: center;
  aspect-ratio: 1 / 1; background: #fff; padding: 18px; overflow: hidden;
  border-bottom: 1px solid var(--border-color);
}
/* Product shots are cut-outs on white; contain keeps the whole product in
   frame instead of cropping a laptop down to its keyboard. */
.pk-aff-thumb img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }
.pk-aff-noimg { font-weight: 900; font-size: 1.4rem; color: var(--pk-store); opacity: 0.5; }
.pk-aff-store {
  position: absolute; left: 10px; top: 10px; padding: 4px 9px; border-radius: 20px;
  background: var(--pk-store); color: var(--pk-store-ink);
  font-size: 0.64rem; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase;
}
.pk-aff-off {
  position: absolute; right: 10px; top: 10px; padding: 4px 9px; border-radius: 20px;
  background: #0f9d58; color: #fff; font-size: 0.68rem; font-weight: 800;
}
.pk-aff-body { display: flex; flex-direction: column; gap: 8px; padding: 14px 14px 16px; flex: 1; }
.pk-aff-flags { display: flex; flex-wrap: wrap; gap: 6px; }
.pk-aff-badge, .pk-aff-deadline {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 6px; font-size: 0.64rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;
}
.pk-aff-badge { background: rgba(229,9,20,0.09); color: var(--accent-main); }
.pk-aff-deadline { background: rgba(245,158,11,0.13); color: #b45309; }
.pk-aff-title {
  font-size: 0.88rem; font-weight: 700; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  min-height: 2.8em;
}
.pk-aff-rating { display: inline-flex; align-items: center; gap: 4px; font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); }
.pk-aff-rating em { font-style: normal; font-weight: 500; color: var(--text-dim); }
.pk-aff-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-top: auto; }
.pk-aff-price strong { font-size: 1.12rem; font-weight: 900; color: var(--text-main); }
.pk-aff-price strong.is-check { font-size: 0.9rem; color: var(--text-secondary); }
.pk-aff-price s { font-size: 0.8rem; color: var(--text-dim); }
.pk-aff-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border-color);
  background: var(--surface-1); font-size: 0.8rem; font-weight: 800; color: var(--text-main);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.pk-aff-card.is-compact .pk-aff-thumb { padding: 12px; }
.pk-aff-card.is-compact .pk-aff-body { padding: 12px; gap: 6px; }
.pk-aff-card.is-compact .pk-aff-title { font-size: 0.82rem; }
.pk-aff-disclosure {
  display: flex; gap: 8px; align-items: flex-start;
  font-size: 0.74rem; line-height: 1.55; color: var(--text-dim);
}
@media (max-width: 520px) {
  .pk-aff-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .pk-aff-body { padding: 10px 10px 12px; }
  .pk-aff-price strong { font-size: 0.98rem; }
  .pk-aff-cta { padding: 9px 8px; font-size: 0.74rem; }
}
`;
