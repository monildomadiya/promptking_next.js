"use client";

import React, { useMemo, useState } from 'react';
import { Info, Tag, Sparkles, Search } from '@/components/Common/Icons';
import AffiliateProductCard, { productCardStyles } from '@/components/Affiliate/ProductCard';
import { storeInfo } from '@/lib/affiliateLinks';

const SORTS = [
  { id: 'featured', label: 'Recommended' },
  { id: 'discount', label: 'Biggest discount' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
];

const titleFor = (title) => {
  // The last word gets the accent, the way "AI Wallpapers" does on /wallpapers.
  const words = String(title || '').trim().split(/\s+/);
  if (words.length < 2) return <em>{title}</em>;
  return <>{words.slice(0, -1).join(' ')} <em>{words[words.length - 1]}</em></>;
};

export default function ClientDeals({ products = [], title, subtitle, disclosure }) {
  const [store, setStore] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  const [query, setQuery] = useState('');

  // Only stores and categories that actually have something in them: a
  // "Myntra" pill that filters to nothing is a broken promise.
  const stores = useMemo(() => {
    const counts = new Map();
    products.forEach((p) => counts.set(p.store, (counts.get(p.store) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ id, count, ...storeInfo(id) }));
  }, [products]);

  const categories = useMemo(() => {
    const counts = new Map();
    products.forEach((p) => { if (p.category) counts.set(p.category, (counts.get(p.category) || 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [products]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (store !== 'all' && p.store !== store) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q)
        || (p.category || '').toLowerCase().includes(q)
        || p.tags.some((t) => t.toLowerCase().includes(q));
    });
    const price = (p) => p.price || 0;
    if (sort === 'discount') return [...list].sort((a, b) => b.discount - a.discount);
    if (sort === 'price_asc') return [...list].sort((a, b) => (price(a) || Infinity) - (price(b) || Infinity));
    if (sort === 'price_desc') return [...list].sort((a, b) => price(b) - price(a));
    if (sort === 'rating') return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [products, store, category, sort, query]);

  const bestDiscount = products.reduce((m, p) => Math.max(m, p.discount || 0), 0);

  // Amazon's operating agreement: a displayed price has to say when it was
  // true. The oldest check on the page is the honest one to quote.
  const oldestCheck = products
    .map((p) => p.priceUpdatedAt && p.price ? new Date(p.priceUpdatedAt) : null)
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  return (
    <main className="pk-deals">
      <style>{productCardStyles + styles}</style>

      <section className="pk-deals-hero">
        <div className="pk-deals-hero-body">
          <span className="pk-deals-eyebrow"><Sparkles size={13} /> Curated picks</span>
          <h1>{titleFor(title)}</h1>
          {subtitle && <p>{subtitle}</p>}
          <ul className="pk-deals-stats">
            <li><strong>{products.length}</strong> product{products.length === 1 ? '' : 's'}</li>
            {stores.slice(0, 3).map((s) => (
              <li key={s.id}><strong>{s.count}</strong> on {s.label}</li>
            ))}
            {bestDiscount > 0 && <li>Up to <strong>{bestDiscount}%</strong> off</li>}
          </ul>
        </div>
      </section>

      {disclosure && (
        <p className="pk-aff-disclosure pk-deals-disclosure">
          <Info size={14} style={{ marginTop: 2 }} /> <span>{disclosure}</span>
        </p>
      )}

      {products.length > 0 ? (
        <>
          <div className="pk-deals-bar">
            <div className="pk-deals-seg" role="group" aria-label="Filter by store">
              <button type="button" className={store === 'all' ? 'is-on' : ''} aria-pressed={store === 'all'} onClick={() => setStore('all')}>
                All <span>{products.length}</span>
              </button>
              {stores.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={store === s.id ? 'is-on' : ''}
                  aria-pressed={store === s.id}
                  onClick={() => setStore(s.id)}
                  style={{ '--pk-store': s.color }}
                >
                  <i aria-hidden="true" /> {s.label} <span>{s.count}</span>
                </button>
              ))}
            </div>

            <div className="pk-deals-tools">
              <label className="pk-deals-search">
                <Search size={15} />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products" />
              </label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {categories.length > 1 && (
            <div className="pk-deals-chips" role="group" aria-label="Filter by category">
              <button type="button" className={category === 'all' ? 'is-on' : ''} onClick={() => setCategory('all')}>
                <Tag size={12} /> All categories
              </button>
              {categories.map((c) => (
                <button key={c.name} type="button" className={category === c.name ? 'is-on' : ''} onClick={() => setCategory(c.name)}>
                  {c.name} <span>{c.count}</span>
                </button>
              ))}
            </div>
          )}

          {shown.length > 0 ? (
            <div className="pk-aff-grid">
              {shown.map((p) => <AffiliateProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="pk-deals-empty">
              Nothing matches that filter.{' '}
              <button type="button" onClick={() => { setStore('all'); setCategory('all'); setQuery(''); }}>Show everything</button>
            </div>
          )}

          {oldestCheck && (
            <p className="pk-deals-note" suppressHydrationWarning>
              Prices and availability are accurate as of {oldestCheck.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })} and
              are subject to change. The price and availability shown on the store at the time of purchase will apply.
            </p>
          )}
        </>
      ) : (
        <div className="pk-deals-empty">New picks are on their way — check back soon.</div>
      )}
    </main>
  );
}

const styles = `
.pk-deals { max-width: var(--container-max); width: 100%; margin: 0 auto; padding: 24px var(--container-pad) 70px; }

.pk-deals-hero {
  position: relative; isolation: isolate; overflow: hidden;
  border-radius: 28px; margin-bottom: 16px;
  padding: clamp(34px, 5.5vw, 64px) clamp(20px, 5vw, 56px);
  background:
    radial-gradient(70% 120% at 12% 0%, rgba(255,153,0,0.32), transparent 60%),
    radial-gradient(70% 120% at 88% 100%, rgba(40,116,240,0.36), transparent 60%),
    #0c0e15;
  display: flex; align-items: center; justify-content: center; text-align: center;
}
.pk-deals-hero-body { max-width: 680px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.pk-deals-eyebrow {
  display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 30px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18);
  font-size: 0.68rem; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase; color: #fff;
}
.pk-deals-hero h1 { margin: 0; color: #fff; font-size: clamp(1.9rem, 5.6vw, 3.2rem); font-weight: 900; letter-spacing: -1.4px; line-height: 1.05; }
.pk-deals-hero h1 em {
  font-style: normal;
  background: linear-gradient(100deg, #ffb347, #ff9900 45%, #5aa2ff);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.pk-deals-hero p { margin: 0; max-width: 52ch; font-size: clamp(0.88rem, 2.4vw, 1rem); line-height: 1.65; color: rgba(255,255,255,0.76); }
.pk-deals-stats { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; list-style: none; margin: 4px 0 0; padding: 0; }
.pk-deals-stats li {
  padding: 7px 15px; border-radius: 30px; background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.14);
  font-size: 0.76rem; font-weight: 600; color: rgba(255,255,255,0.78);
}
.pk-deals-stats strong { color: #fff; font-weight: 800; }

.pk-deals-disclosure {
  margin: 0 0 20px; padding: 12px 16px; border-radius: 14px;
  background: var(--surface-1); border: 1px solid var(--border-color);
}

.pk-deals-bar { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.pk-deals-seg {
  display: inline-flex; gap: 2px; padding: 3px; border-radius: 30px; max-width: 100%; overflow-x: auto; scrollbar-width: none;
  background: var(--surface-2); border: 1px solid var(--border-color);
}
.pk-deals-seg::-webkit-scrollbar { display: none; }
.pk-deals-seg button {
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; cursor: pointer;
  padding: 8px 14px; border-radius: 30px; border: 1px solid transparent; background: transparent;
  font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);
}
.pk-deals-seg button i { width: 8px; height: 8px; border-radius: 50%; background: var(--pk-store); }
.pk-deals-seg button span { font-size: 0.7rem; color: var(--text-dim); font-weight: 700; }
.pk-deals-seg button.is-on { background: var(--surface-0); color: var(--text-main); border-color: var(--border-color); }

.pk-deals-tools { display: flex; gap: 10px; flex-wrap: wrap; }
.pk-deals-search {
  display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 30px;
  background: var(--surface-1); border: 1px solid var(--border-color); color: var(--text-dim);
}
.pk-deals-search input { border: none; outline: none; background: transparent; padding: 10px 0; font-size: 0.82rem; color: var(--text-main); width: 170px; }
.pk-deals-tools select {
  padding: 10px 14px; border-radius: 30px; border: 1px solid var(--border-color); background: var(--surface-1);
  font-size: 0.82rem; font-weight: 600; color: var(--text-main); cursor: pointer;
}

.pk-deals-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin-bottom: 20px; padding-bottom: 2px; }
.pk-deals-chips::-webkit-scrollbar { display: none; }
.pk-deals-chips button {
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; cursor: pointer;
  padding: 7px 13px; border-radius: 30px; border: 1px solid var(--border-color); background: var(--surface-0);
  font-size: 0.76rem; font-weight: 700; color: var(--text-secondary);
}
.pk-deals-chips button span { color: var(--text-dim); font-size: 0.68rem; }
.pk-deals-chips button.is-on { background: var(--text-main); color: var(--surface-0); border-color: var(--text-main); }
.pk-deals-chips button.is-on span { color: inherit; opacity: 0.7; }

.pk-deals-empty {
  padding: 60px 20px; text-align: center; border-radius: 20px; border: 1px dashed var(--border-color);
  color: var(--text-secondary); font-weight: 600;
}
.pk-deals-empty button { background: none; border: none; color: var(--accent-main); font-weight: 800; cursor: pointer; }
.pk-deals-note { margin: 22px 0 0; font-size: 0.72rem; line-height: 1.6; color: var(--text-dim); text-align: center; }

@media (max-width: 640px) {
  .pk-deals-tools { width: 100%; }
  .pk-deals-search { flex: 1; }
  .pk-deals-search input { width: 100%; }
}
`;
