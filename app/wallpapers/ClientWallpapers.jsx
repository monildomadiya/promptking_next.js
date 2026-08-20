"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Smartphone, Monitor, Download, ArrowRight } from '@/components/Common/Icons';
import WallpaperImage from '@/components/Wallpapers/WallpaperImage';

const FILTERS = [
  { id: 'all', label: 'All', Icon: ImageIcon },
  { id: 'phone', label: 'Phone', Icon: Smartphone },
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
];

/* ── Masonry ───────────────────────────────────────────────────────────────
 *
 * The grid was a wall of identical 3:4 boxes, so a 9:16 phone wallpaper and a
 * 16:9 desktop one arrived looking the same and both arrived cropped. Here
 * every tile keeps the shape of its own file: the column decides the width,
 * the image's own ratio decides the height.
 *
 * Packing is done from the stored width/height rather than by measuring the
 * DOM, which is what lets the server render the finished layout — a masonry
 * that waits for images to load is a page that jumps under the reader's thumb
 * and a page Google first sees as a single column.
 */
const COLUMN_MIN = 230;
const GRID_GAP = 18;
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 5;

// Columns are rendered as their own lists, so this is also the server's guess.
// Three is the one that looks deliberate at any width: not a lonely pair on a
// wide screen, not five slivers on a laptop, for the frame before the real
// width is known.
const DEFAULT_COLUMNS = 3;

/**
 * Tile height as a multiple of its width.
 *
 * Clamped because the extremes wreck the wall rather than decorate it: a
 * panorama becomes a letterbox slit with an unreadable thumbnail, and a very
 * tall crop runs a column past the fold on its own. Inside the clamp the tile
 * is the file's true shape; outside it, the file is shown centre-cropped to
 * the limit — the same bargain the grid used to strike with every image.
 */
const tileRatio = (w) => {
  if (!w.width || !w.height) return 1.33;
  return Math.min(1.85, Math.max(0.62, w.height / w.width));
};

/** `aspect-ratio` for the tile, matching whatever tileRatio settled on. */
const tileAspect = (w) => `1 / ${tileRatio(w).toFixed(4)}`;

// The title and download count under a tile, in pixels. Fixed height, unlike
// the tile above it — which is why the packer needs the real column width to
// know what it is worth: 52px is a fifth of a wide column and a third of a
// narrow one, and pretending otherwise leaves phone columns visibly uneven.
const CAPTION_PX = 52;

/**
 * Shortest-column-first, a row at a time.
 *
 * Not a CSS column-count wrapper: those fill the first column top to bottom
 * before starting the second, which would push the featured wallpapers — the
 * ones the ORDER BY puts first — down the left edge instead of across the top.
 *
 * Items are taken a row's worth at a time and the tallest in that batch goes to
 * whichever column is currently shortest. Straight greedy in strict order also
 * works, but it hands out the tall tiles blind and finishes with one column
 * hanging several hundred pixels below its neighbours; deciding within a row
 * costs nothing, keeps every item inside its own band of the page, and lands
 * the bottoms close to level.
 */
const packColumns = (items, columns, captionUnits) => {
  const buckets = Array.from({ length: columns }, () => []);
  const heights = new Array(columns).fill(0);

  for (let start = 0; start < items.length; start += columns) {
    const row = items
      .slice(start, start + columns)
      .map((item, index) => ({ item, index, height: tileRatio(item) + captionUnits }))
      // Tallest first, original order breaking ties so the pass is stable.
      .sort((a, b) => b.height - a.height || a.index - b.index);

    for (const { item, height } of row) {
      let shortest = 0;
      for (let i = 1; i < columns; i += 1) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      buckets[shortest].push(item);
      heights[shortest] += height;
    }
  }

  return buckets;
};

export default function ClientWallpapers({ wallpapers = [], categories = [] }) {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  // 0 until the grid has been measured — the server has no width to work from.
  const [columnWidth, setColumnWidth] = useState(0);
  const gridRef = useRef(null);

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

  const hasItems = shown.length > 0;
  const packed = useMemo(() => {
    // Before the first measurement the caption is guessed at a fifth of the
    // column; every card carries the same one, so the guess costs only a
    // slightly uneven first paint on the way to the measured layout.
    const captionUnits = columnWidth ? CAPTION_PX / columnWidth : 0.2;
    return packColumns(shown, columns, captionUnits);
  }, [shown, columns, columnWidth]);

  // The grid's own width, not a media query. This page is a centred container
  // with padding that changes at breakpoints, so the viewport width is never
  // quite what the columns have to divide up.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;

    const measure = () => {
      const width = el.clientWidth;
      if (!width) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || GRID_GAP;
      const next = Math.max(
        MIN_COLUMNS,
        Math.min(MAX_COLUMNS, Math.floor((width + gap) / (COLUMN_MIN + gap))),
      );
      setColumns((current) => (current === next ? current : next));
      setColumnWidth((width - gap * (next - 1)) / next);
    };

    measure();

    // Observing the element rather than the window: a sidebar or a scrollbar
    // appearing changes the grid's width without the viewport moving at all.
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // The grid is not in the DOM while a filter matches nothing, so there is
    // nothing to observe until it comes back.
  }, [hasItems]);

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
        <div
          className="pk-wp-grid"
          ref={gridRef}
          style={{ '--pk-cols': columns }}
        >
          {packed.map((column, index) => (
            <div className="pk-wp-col" key={index}>
              {column.map((w) => (
                <Link key={w.slug} href={`/wallpapers/${w.slug}`} className="pk-wp-card">
                  <span className="pk-wp-thumb" style={{ aspectRatio: tileAspect(w) }}>
                    <WallpaperImage
                      image={w.image}
                      alt={w.title}
                      // The tile is the image's own shape, so ask Cloudinary
                      // for the whole file scaled down rather than a 3:4 crop
                      // of it. Without stored dimensions the tile falls back to
                      // a fixed box, and there the crop is still the right call.
                      ratio={w.width && w.height ? null : '3:4'}
                      // Two columns on a phone, a ~250px cell on desktop. The
                      // browser multiplies these by its own pixel ratio, which
                      // is why the ladder runs past the largest CSS size here.
                      widths={[200, 300, 400, 600, 800]}
                      sizes="(max-width: 560px) 45vw, 260px"
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

/* Columns are real elements rather than a column-count wrapper, so the gap
   between them is the grid's and the gap inside one is the column's. Both read
   from one variable — a masonry with mismatched gutters looks like a bug. */
.pk-wp-grid {
  display: grid; gap: var(--pk-gap, 18px);
  grid-template-columns: repeat(var(--pk-cols, 3), minmax(0, 1fr));
  align-items: start;
}
.pk-wp-col { display: flex; flex-direction: column; gap: var(--pk-gap, 18px); min-width: 0; }

.pk-wp-card { text-decoration: none; display: flex; flex-direction: column; gap: 9px; }
.pk-wp-thumb {
  position: relative; display: block; overflow: hidden;
  border-radius: 18px;
  /* Inline aspect-ratio carries the file's own shape; this is the fallback for
     a wallpaper uploaded before dimensions were stored. */
  aspect-ratio: 3 / 4;
  background: linear-gradient(150deg, rgba(0,0,0,0.07), rgba(0,0,0,0.03));
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease;
}
.pk-wp-card:hover .pk-wp-thumb {
  transform: translateY(-4px);
  box-shadow: 0 16px 34px rgba(0,0,0,0.17);
}

/* A scrim under the download pill. On a light wallpaper a white pill on white
   pixels is invisible, and this is the only thing standing behind it. */
.pk-wp-thumb::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to top, rgba(0,0,0,0.42), rgba(0,0,0,0) 42%);
  opacity: 0; transition: opacity 0.25s ease;
}
.pk-wp-card:hover .pk-wp-thumb::after { opacity: 1; }
/* <picture> is inline by default; without this the img's percentage height
   resolves against an auto-height wrapper and the card collapses. */
.pk-wp-thumb picture { display: contents; }
.pk-wp-thumb img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
}
.pk-wp-card:hover .pk-wp-thumb img { transform: scale(1.05); }

.pk-wp-badge {
  position: absolute; left: 50%; bottom: 12px; transform: translate(-50%, 8px); z-index: 1;
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
  .pk-wp-thumb::after { opacity: 1; }
}

/* The lift and the zoom are decoration; the layout does not depend on them. */
@media (prefers-reduced-motion: reduce) {
  .pk-wp-thumb, .pk-wp-thumb img, .pk-wp-badge { transition: none; }
  .pk-wp-card:hover .pk-wp-thumb { transform: none; }
  .pk-wp-card:hover .pk-wp-thumb img { transform: none; }
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
  .pk-wp-grid { --pk-gap: 12px; }
  .pk-wp-thumb { border-radius: 14px; }
}
`;
