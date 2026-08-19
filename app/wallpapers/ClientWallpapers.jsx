"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Smartphone, Monitor, Download, ArrowRight } from '@/components/Common/Icons';
import WallpaperImage from '@/components/Wallpapers/WallpaperImage';

const FILTERS = [
  { id: 'all', label: 'All', Icon: ImageIcon },
  { id: 'phone', label: 'Phone', Icon: Smartphone },
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
];

export default function ClientWallpapers({ wallpapers = [], categories = [] }) {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');

  // Deliberately NOT useSearchParams. Reading it would put this component in a
  // Suspense boundary, and Next then drops the whole subtree from the static
  // prerender — which on this page means the HTML ships with no wallpapers in
  // it at all. For a section that exists to be found in search, an empty
  // document is the one outcome worth designing around.
  //
  // So the grid renders server-side showing everything, and the URL's category
  // is applied here on mount instead. A shared ?category= link still lands on
  // the right collection; it just arrives a frame later.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('category') || 'all';
    if (categories.some((c) => c.slug === fromUrl)) setCategory(fromUrl);
  }, [categories]);

  const pickCategory = (slug) => {
    setCategory(slug);
    // history rather than the router: this is a filter over data already in
    // the browser, so a navigation would re-run the route for nothing.
    const params = new URLSearchParams(window.location.search);
    if (slug === 'all') params.delete('category');
    else params.set('category', slug);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `/wallpapers?${query}` : '/wallpapers');
  };

  const shown = useMemo(() => {
    return wallpapers.filter((w) => {
      if (category !== 'all' && w.categorySlug !== category) return false;
      if (filter === 'all') return true;
      // `both` belongs in either column — it is the answer to "does this crop
      // sensibly for that screen", not an exclusive category.
      return w.orientation === filter || w.orientation === 'both';
    });
  }, [wallpapers, filter, category]);

  return (
    <main className="pk-wp-page">
      <style>{styles}</style>

      <header className="pk-wp-head">
        <span className="pk-wp-eyebrow">Free downloads</span>
        <h1>
          AI <span className="pk-wp-accent">Wallpapers</span>
        </h1>
        <p>
          {wallpapers.length > 0
            ? `${wallpapers.length} AI-generated wallpaper${wallpapers.length === 1 ? '' : 's'}, sized for phone and desktop. No sign-up, no watermark — pick a size and the file downloads.`
            : 'AI-generated wallpapers, sized for phone and desktop. No sign-up, no watermark.'}
        </p>
      </header>

      {categories.length > 0 && (
        <nav className="pk-wp-cats" aria-label="Wallpaper categories">
          <button
            type="button"
            className={`pk-wp-cat ${category === 'all' ? 'is-on' : ''}`}
            onClick={() => pickCategory('all')}
            aria-pressed={category === 'all'}
          >
            All <span>{wallpapers.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`pk-wp-cat ${category === c.slug ? 'is-on' : ''}`}
              onClick={() => pickCategory(c.slug)}
              aria-pressed={category === c.slug}
            >
              {c.name} <span>{c.count}</span>
            </button>
          ))}
        </nav>
      )}

      {wallpapers.length > 0 && (
        <nav className="pk-wp-filters" aria-label="Filter wallpapers by screen">
          {FILTERS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`pk-wp-filter ${filter === id ? 'is-on' : ''}`}
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>
      )}

      {shown.length === 0 ? (
        <div className="pk-wp-empty">
          <span className="pk-wp-empty-icon"><ImageIcon size={26} /></span>
          <strong>{wallpapers.length === 0 ? 'No wallpapers yet' : 'Nothing for that screen yet'}</strong>
          <span>
            {wallpapers.length === 0
              ? 'New AI wallpapers are on the way — check back shortly.'
              : 'Try a different screen size, or browse them all.'}
          </span>
          {wallpapers.length === 0 ? (
            <Link href="/">Browse prompts <ArrowRight size={14} /></Link>
          ) : (
            <button
              type="button"
              onClick={() => { setFilter('all'); pickCategory('all'); }}
            >Show all</button>
          )}
        </div>
      ) : (
        <div className="pk-wp-grid">
          {shown.map((w) => (
            <Link key={w.slug} href={`/wallpapers/${w.slug}`} className="pk-wp-card">
              <span className="pk-wp-thumb">
                <WallpaperImage
                  image={w.image}
                  alt={w.title}
                  // Two columns on a phone, a ~240px cell on desktop. The
                  // browser multiplies these by its own pixel ratio, which is
                  // why the ladder runs past the largest CSS size here.
                  widths={[200, 300, 400, 600, 800]}
                  sizes="(max-width: 560px) 45vw, 240px"
                />
                <span className="pk-wp-badge">
                  <Download size={13} /> Download
                </span>
              </span>
              <span className="pk-wp-name">{w.title}</span>
              {w.downloadCount > 0 && (
                <span className="pk-wp-count">{w.downloadCount.toLocaleString()} downloads</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

const styles = `
.pk-wp-page {
  max-width: var(--container-max); width: 100%;
  margin: 0 auto; padding: 40px 20px 70px;
}

.pk-wp-head { text-align: center; margin-bottom: 26px; }
.pk-wp-eyebrow {
  display: inline-block; margin-bottom: 10px;
  font-size: 0.7rem; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase;
  color: var(--accent-main);
}
.pk-wp-head h1 {
  margin: 0 0 12px; font-size: clamp(1.9rem, 5vw, 2.9rem);
  font-weight: 900; letter-spacing: -1px; color: var(--text-main);
}
.pk-wp-accent { color: var(--accent-main); }
.pk-wp-head p {
  margin: 0 auto; max-width: 620px;
  font-size: 0.95rem; line-height: 1.65; color: var(--text-secondary);
}

.pk-wp-cats {
  display: flex; justify-content: center; flex-wrap: wrap;
  gap: 8px; margin-bottom: 14px;
}
.pk-wp-cat {
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
  padding: 9px 17px; border-radius: 30px;
  background: var(--surface-1, #fff); border: 1px solid rgba(0,0,0,0.12);
  font-size: 0.84rem; font-weight: 700; color: var(--text-main);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.pk-wp-cat span {
  font-size: 0.72rem; font-weight: 800; opacity: 0.55;
  font-variant-numeric: tabular-nums;
}
.pk-wp-cat:hover { border-color: rgba(229,9,20,0.4); }
.pk-wp-cat.is-on {
  background: var(--accent-main); border-color: var(--accent-main); color: #fff;
}
.pk-wp-cat.is-on span { opacity: 0.8; }

.pk-wp-filters { display: flex; justify-content: center; gap: 8px; margin-bottom: 30px; flex-wrap: wrap; }
.pk-wp-filter {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 9px 16px; border-radius: 30px;
  background: var(--surface-1, #fff); border: 1px solid rgba(0,0,0,0.12);
  font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.pk-wp-filter:hover { border-color: rgba(229,9,20,0.4); color: var(--text-main); }
.pk-wp-filter.is-on {
  background: var(--accent-main); border-color: var(--accent-main); color: #fff;
}

.pk-wp-grid {
  display: grid; gap: 18px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.pk-wp-card { text-decoration: none; display: flex; flex-direction: column; gap: 9px; }
.pk-wp-thumb {
  position: relative; display: block; overflow: hidden;
  border-radius: 18px; aspect-ratio: 3 / 4;
  background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.08);
}
/* <picture> is inline by default; without this the img's percentage height
   resolves against an auto-height wrapper and the card collapses. */
.pk-wp-thumb picture { display: contents; }
.pk-wp-thumb img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
}
.pk-wp-card:hover .pk-wp-thumb img { transform: scale(1.05); }

.pk-wp-badge {
  position: absolute; left: 50%; bottom: 12px; transform: translate(-50%, 8px);
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 15px; border-radius: 30px;
  background: rgba(255,255,255,0.94); backdrop-filter: blur(6px);
  font-size: 0.76rem; font-weight: 800; color: #1a1a1a;
  opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease;
  pointer-events: none;
}
.pk-wp-card:hover .pk-wp-badge { opacity: 1; transform: translate(-50%, 0); }

.pk-wp-name {
  font-size: 0.87rem; font-weight: 700; line-height: 1.4; color: var(--text-main);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pk-wp-count { font-size: 0.72rem; color: var(--text-secondary); margin-top: -4px; }

.pk-wp-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 60px 20px; text-align: center;
}
.pk-wp-empty-icon {
  width: 58px; height: 58px; border-radius: 18px; margin-bottom: 4px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(229,9,20,0.07); border: 1px solid rgba(229,9,20,0.18);
  color: var(--accent-main);
}
.pk-wp-empty strong { font-size: 1.05rem; font-weight: 800; color: var(--text-main); }
.pk-wp-empty span { font-size: 0.86rem; color: var(--text-secondary); max-width: 380px; }
.pk-wp-empty a, .pk-wp-empty button {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  margin-top: 8px; padding: 10px 20px; border-radius: 30px; border: none;
  background: var(--accent-main); color: #fff; text-decoration: none;
  font-size: 0.84rem; font-weight: 800;
}

/* The badge is a hover affordance and there is no hover on a phone, so show it
   outright rather than leaving a control nobody can reveal. */
@media (hover: none) {
  .pk-wp-badge { opacity: 1; transform: translate(-50%, 0); }
}

@media (max-width: 560px) {
  .pk-wp-page { padding: 28px 16px 50px; }
  /* A dozen categories wrapping into five rows pushes the grid off screen, so
     scroll them sideways instead and keep the images in view. */
  .pk-wp-cats {
    flex-wrap: nowrap; justify-content: flex-start;
    overflow-x: auto; scrollbar-width: none;
    margin-inline: -16px; padding-inline: 16px;
  }
  .pk-wp-cats::-webkit-scrollbar { display: none; }
  .pk-wp-cat { flex-shrink: 0; }
  .pk-wp-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .pk-wp-thumb { border-radius: 14px; }
}
`;
