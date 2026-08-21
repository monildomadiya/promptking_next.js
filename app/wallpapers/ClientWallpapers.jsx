"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Crop,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Sparkles,
  Star,
} from '@/components/Common/Icons';
import CategoryRail from '@/components/Wallpapers/CategoryRail';
import WallpaperImage from '@/components/Wallpapers/WallpaperImage';
import { NO_CATEGORY, previewUrl } from '@/lib/wallpaperUrls';

const FILTERS = [
  { id: 'all', label: 'All', Icon: ImageIcon },
  { id: 'phone', label: 'Phone', Icon: Smartphone },
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
];

/* ── Masonry ───────────────────────────────────────────────────────────────
 *
 * Every tile keeps the shape of its own file: the column decides the width,
 * the image's own ratio decides the height. Packing is done from the stored
 * width/height rather than by measuring the DOM, which is what lets the server
 * render the finished layout — a masonry that waits for images to load is a
 * page that jumps under the reader's thumb and a page Google first sees as a
 * single column.
 */
const COLUMN_MIN = 230;
/* And the widest a column is allowed to get. It never binds on a full page —
 * five 340px columns are wider than the container — so it only matters when
 * there are fewer wallpapers than columns, which is exactly when a grid left
 * to itself puts one small card against the left margin and calls it a page. */
const COLUMN_MAX = 340;
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

const screenLabel = (orientation) =>
  orientation === 'phone' ? 'Phone' : orientation === 'desktop' ? 'Desktop' : 'Any screen';

export default function ClientWallpapers({ wallpapers = [], categories = [] }) {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [fitColumns, setFitColumns] = useState(DEFAULT_COLUMNS);
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
    if (fromUrl === NO_CATEGORY || categories.some((c) => c.slug === fromUrl)) setCategory(fromUrl);
  }, [categories]);

  /*
   * Where to come back to.
   *
   * The category lives in the URL, but a wallpaper's page is a different route
   * and cannot see it - so its back link was a hardcoded /wallpapers, which
   * quietly dumped anyone who had filtered the wall back into the unfiltered
   * one. The listing leaves its query here on the way out instead.
   *
   * sessionStorage rather than a ?from= on every card link: the detail page is
   * the one indexed, shared and linked to, and it has no business carrying a
   * record of how each visitor happened to arrive at it.
   */
  useEffect(() => {
    try {
      window.sessionStorage.setItem('pk-wallpapers-return', window.location.search);
    } catch {
      /* Private mode, or storage disabled. The back link falls back to /wallpapers. */
    }
  }, [category]);

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

  /*
   * The chips: every real category, and - only when there are any - one more
   * for the wallpapers that were saved without one. Computed from the list
   * already in hand rather than stored, so it is never stale and cannot
   * survive the last uncategorised wallpaper being filed.
   */
  const loose = useMemo(() => wallpapers.filter((w) => !w.categorySlug).length, [wallpapers]);
  const chips = useMemo(() => {
    if (!loose || categories.some((c) => c.slug === NO_CATEGORY)) return categories;
    return [...categories, { slug: NO_CATEGORY, name: 'Others', count: loose }];
  }, [categories, loose]);

  const shown = useMemo(() => {
    return wallpapers.filter((w) => {
      if (category === NO_CATEGORY) {
        if (w.categorySlug) return false;
      } else if (category !== 'all' && w.categorySlug !== category) return false;
      if (filter === 'all') return true;
      // `both` belongs in either column — it is the answer to "does this crop
      // sensibly for that screen", not an exclusive category.
      return w.orientation === filter || w.orientation === 'both';
    });
  }, [wallpapers, filter, category]);

  const hasItems = shown.length > 0;

  // Never more columns than there are wallpapers to put in them. Three empty
  // columns beside one card is the layout reading as broken rather than as
  // sparse; the CSS cap on the grid's own width then centres what is left.
  const columns = Math.max(1, Math.min(fitColumns, shown.length || 1));

  const packed = useMemo(() => {
    // Before the first measurement the caption is guessed at a fifth of the
    // column; every card carries the same one, so the guess costs only a
    // slightly uneven first paint on the way to the measured layout.
    const captionUnits = columnWidth ? CAPTION_PX / columnWidth : 0.2;
    return packColumns(shown, columns, captionUnits);
  }, [shown, columns, columnWidth]);

  // The width available to the grid, not a media query: this page is a centred
  // container with padding that changes at breakpoints, so the viewport width
  // is never quite what the columns have to divide up.
  //
  // What is measured is the wrapper rather than the grid itself. The grid caps
  // its own width to centre an under-filled wall, and that cap is computed from
  // the column count — so measuring the grid would feed its answer back into
  // its own question, and a layout that had once narrowed could never widen
  // again. The wrapper is always the full container.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;

    const measure = () => {
      const width = el.clientWidth;
      if (!width) return;
      const gap = parseFloat(getComputedStyle(el).getPropertyValue('--pk-gap')) || GRID_GAP;
      const next = Math.max(
        MIN_COLUMNS,
        Math.min(MAX_COLUMNS, Math.floor((width + gap) / (COLUMN_MIN + gap))),
      );
      setFitColumns((current) => (current === next ? current : next));
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

  /*
   * The hero's backdrop is a wallpaper, not a stock gradient — the page is
   * about pictures, so the picture should be doing the work. It is the same
   * URL the first tile renders, so it costs one cached request rather than a
   * second download, and it is blurred far past the point where its subject
   * matters: what survives is the palette.
   */
  const hero = wallpapers.find((w) => w.isFeatured) || wallpapers[0] || null;
  const heroSrc = hero ? previewUrl(hero.image, 1200) : null;

  const total = wallpapers.length;
  const filtered = shown.length !== total;

  return (
    <main className="pk-wl">
      <style>{styles}</style>

      <section className={`pk-wl-hero ${heroSrc ? '' : 'is-plain'}`}>
        {heroSrc && (
          <img className="pk-wl-hero-bg" src={heroSrc} alt="" aria-hidden="true" fetchPriority="low" />
        )}
        <div className="pk-wl-hero-body">
          <span className="pk-wl-eyebrow">
            <Sparkles size={13} /> Free downloads
          </span>
          <h1>
            AI <em>Wallpapers</em>
          </h1>
          <p>
            Hand-picked, high-resolution and yours in one tap. Crop any of them to your
            own screen before you save it — no sign-up, no watermark.
          </p>
          <ul className="pk-wl-stats">
            <li>
              <strong>{total}</strong> wallpaper{total === 1 ? '' : 's'}
            </li>
            <li>
              <strong>Phone</strong> &amp; desktop
            </li>
            <li>
              <strong>0</strong> sign-ups
            </li>
          </ul>
        </div>
      </section>

      {total > 0 && (
        <div className="pk-wl-bar">
          {chips.length > 0 && (
            <CategoryRail
              categories={chips}
              total={total}
              active={category}
              onPick={pickCategory}
            />
          )}

          <div className="pk-wl-seg" role="group" aria-label="Filter by screen">
            {FILTERS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`pk-wl-segbtn ${filter === id ? 'is-on' : ''}`}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="pk-wl-empty">
          <span className="pk-wl-empty-icon">
            <ImageIcon size={26} />
          </span>
          <strong>{total === 0 ? 'No wallpapers yet' : 'Nothing for that screen yet'}</strong>
          <span>
            {total === 0
              ? 'New AI wallpapers are on the way — check back shortly.'
              : 'Try a different screen size, or browse them all.'}
          </span>
          {total === 0 ? (
            <Link href="/">
              Browse prompts <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                pickCategory('all');
              }}
            >
              Show all
            </button>
          )}
        </div>
      ) : (
        <>
          {filtered && (
            <p className="pk-wl-count" role="status">
              Showing <strong>{shown.length}</strong> of {total}
            </p>
          )}

          <div className="pk-wl-gridwrap" ref={gridRef}>
            <div className="pk-wl-grid" style={{ '--pk-cols': columns }}>
              {packed.map((column, index) => (
                <div className="pk-wl-col" key={index}>
                {column.map((w) => (
                  <Link key={w.slug} href={`/wallpapers/${w.slug}`} className="pk-wl-card">
                    <span className="pk-wl-thumb" style={{ aspectRatio: tileAspect(w) }}>
                      <WallpaperImage
                        image={w.image}
                        alt={w.title}
                        // The tile is the image's own shape, so ask for the
                        // whole file scaled down rather than a 3:4 crop of it.
                        // Without stored dimensions the tile falls back to a
                        // fixed box, and there the crop is still the right call.
                        ratio={w.width && w.height ? null : '3:4'}
                        // Two columns on a phone, a ~260px cell on desktop. The
                        // browser multiplies these by its own pixel ratio, which
                        // is why the ladder runs past the largest CSS size here.
                        widths={[200, 300, 400, 600, 800]}
                        sizes="(max-width: 560px) 45vw, 260px"
                      />

                      {w.isFeatured && (
                        <span className="pk-wl-flag">
                          <Star size={11} /> Featured
                        </span>
                      )}

                      <span className="pk-wl-veil" aria-hidden="true" />
                      {/* Crop marks rather than a button: the tile is not a
                          download, it is a way in to choosing one, and the
                          same brackets frame the crop on the page it leads
                          to. The glyph is the touch version — no hover to
                          reveal anything, and a full-width pill on a phone
                          covers the picture it is advertising. */}
                      <span className="pk-wl-marks" aria-hidden="true" />
                      <span className="pk-wl-tag">
                        <Crop size={12} /> Crop &amp; save
                      </span>
                      <span className="pk-wl-glyph" aria-hidden="true">
                        <Crop size={13} />
                      </span>
                    </span>

                    <span className="pk-wl-meta">
                      <span className="pk-wl-name">{w.title}</span>
                      <span className="pk-wl-sub">
                        {screenLabel(w.orientation)}
                        {w.downloadCount > 0 && ` · ${w.downloadCount.toLocaleString()} downloads`}
                      </span>
                    </span>
                  </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

const styles = `
.pk-wl { max-width: var(--container-max); width: 100%; margin: 0 auto; padding: 24px var(--container-pad) 70px; }

/* ── Hero ────────────────────────────────────────────────────────────────
   A card rather than a full-bleed band: the header and the footer on this
   site are both rounded cards at the container's width, and 100vw would only
   buy a horizontal scrollbar on every desktop that shows one. */
.pk-wl-hero {
  position: relative; isolation: isolate; overflow: hidden;
  border-radius: 28px; margin-bottom: 24px;
  padding: clamp(38px, 6vw, 74px) clamp(20px, 5vw, 56px);
  background: #0c0e15;
  display: flex; align-items: center; justify-content: center; text-align: center;
}
.pk-wl-hero.is-plain {
  background: radial-gradient(120% 140% at 50% 0%, #2a1016, #0c0e15 62%);
}

/* Scaled up before the blur so the softened edge never reaches the corners,
   and dimmed by the gradient underneath the text rather than by an opacity on
   the image itself — which would grey the colour out along with the contrast. */
.pk-wl-hero-bg {
  position: absolute; inset: -10%; z-index: -2;
  width: 120%; height: 120%; object-fit: cover;
  filter: blur(34px) saturate(1.25);
  transform: scale(1.08);
}
.pk-wl-hero::after {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background:
    linear-gradient(180deg, rgba(8,10,16,0.58), rgba(8,10,16,0.82)),
    radial-gradient(90% 120% at 50% 110%, rgba(229,9,20,0.34), transparent 62%);
}

.pk-wl-hero-body { max-width: 660px; display: flex; flex-direction: column; align-items: center; gap: 14px; }

.pk-wl-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 14px; border-radius: 30px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18);
  font-size: 0.68rem; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase;
  color: #fff;
}

.pk-wl-hero h1 {
  margin: 0; color: #fff;
  font-size: clamp(2.1rem, 6.4vw, 3.6rem); font-weight: 900;
  letter-spacing: -1.6px; line-height: 1.03;
}
.pk-wl-hero h1 em {
  font-style: normal;
  background: linear-gradient(100deg, #ff4d57, var(--accent-main) 55%, #ff8a5c);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.pk-wl-hero p {
  margin: 0; max-width: 44ch;
  font-size: clamp(0.88rem, 2.4vw, 1rem); line-height: 1.65;
  color: rgba(255,255,255,0.76);
}

.pk-wl-stats { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; list-style: none; margin: 4px 0 0; padding: 0; }
.pk-wl-stats li {
  padding: 7px 15px; border-radius: 30px;
  background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.14);
  font-size: 0.76rem; font-weight: 600; color: rgba(255,255,255,0.78);
}
.pk-wl-stats strong { color: #fff; font-weight: 800; }

/* ── Filter bar ──────────────────────────────────────────────────────────
   One row, two jobs: what it is on the left, what screen it is for on the
   right. Two stacked rows of centred pills read as a form nobody finished. */
.pk-wl-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 22px; min-width: 0;
}

/* Segmented rather than three more pills: it is one question with three
   answers, and the shared track says so at a glance. */
.pk-wl-seg {
  display: inline-flex; flex-shrink: 0; gap: 2px; padding: 3px;
  border-radius: 30px; background: var(--surface-2); border: 1px solid var(--border-color);
}
.pk-wl-segbtn {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 8px 15px; border-radius: 30px; border: 1px solid transparent; background: transparent;
  font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.pk-wl-segbtn:hover { color: var(--text-main); }
.pk-wl-segbtn.is-on {
  /* A border, not a shadow: shadows are stripped site-wide, and the raised
     pill needs some edge to lift it off the track it sits in. */
  background: var(--surface-0); color: var(--text-main);
  border-color: var(--border-color);
}

.pk-wl-count { margin: -8px 0 16px; font-size: 0.8rem; color: var(--text-secondary); }
.pk-wl-count strong { color: var(--text-main); font-weight: 800; }

/* ── The wall ────────────────────────────────────────────────────────────
   Columns are real elements rather than a column-count wrapper, so the gap
   between them is the grid's and the gap inside one is the column's. Both read
   from one variable — a masonry with mismatched gutters looks like a bug. */
/* The wrapper owns the gutter and the full container width; the grid inside it
   owns the cap. Keeping those on separate elements is what stops the cap from
   narrowing the very box the column count is measured from. */
.pk-wl-gridwrap { --pk-gap: ${GRID_GAP}px; width: 100%; }
.pk-wl-grid {
  display: grid; gap: var(--pk-gap);
  grid-template-columns: repeat(var(--pk-cols, 3), minmax(0, 1fr));
  align-items: start;
  /* Only binds when there are fewer wallpapers than the width allows, and
     then it centres them instead of stranding one card at the left margin. */
  max-width: min(100%, calc(var(--pk-cols) * ${COLUMN_MAX}px + (var(--pk-cols) - 1) * var(--pk-gap)));
  margin-inline: auto;
}
.pk-wl-col { display: flex; flex-direction: column; gap: var(--pk-gap); min-width: 0; }

.pk-wl-card { text-decoration: none; display: flex; flex-direction: column; gap: 10px; }

.pk-wl-thumb {
  position: relative; display: block; overflow: hidden;
  border-radius: 20px;
  /* Inline aspect-ratio carries the file's own shape; this is the fallback for
     a wallpaper uploaded before dimensions were stored. */
  aspect-ratio: 3 / 4;
  background: linear-gradient(150deg, var(--surface-2), var(--surface-3));
  border: 1px solid var(--border-color);
  transition: transform 0.32s cubic-bezier(0.4,0,0.2,1), border-color 0.32s ease;
}
/* The lift is the whole hover; there is no shadow under it because the site
   strips them, so the border carries the state instead. */
.pk-wl-card:hover .pk-wl-thumb {
  transform: translateY(-5px);
  border-color: rgba(229,9,20,0.45);
}
/* <picture> is inline by default; without this the img's percentage height
   resolves against an auto-height wrapper and the card collapses. */
.pk-wl-thumb picture { display: contents; }
.pk-wl-thumb img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.45s cubic-bezier(0.4,0,0.2,1);
}
.pk-wl-card:hover .pk-wl-thumb img { transform: scale(1.06); }

/* The only thing standing behind the download pill: on a pale wallpaper a
   white pill on white pixels is invisible. */
.pk-wl-veil {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to top, rgba(6,8,14,0.62), rgba(6,8,14,0) 46%);
  opacity: 0; transition: opacity 0.28s ease;
}
.pk-wl-card:hover .pk-wl-veil { opacity: 1; }

/* ── The tile's affordance ───────────────────────────────────────────────
   Not a button. Tapping a tile opens the wallpaper's page, where the crop is
   chosen — so what the hover state should promise is that choice, and a pill
   reading "Download" promises a file that is not about to arrive.

   Crop marks instead: four brackets that close inwards like a viewfinder
   locking on, which is the same shape the crop window wears on the page this
   leads to. Eight background layers rather than eight elements — one span,
   no extra DOM on a wall that may run to hundreds of tiles. */
.pk-wl-marks {
  position: absolute; inset: 12px; pointer-events: none; z-index: 1;
  --mc: rgba(255,255,255,0.96); --mt: 2px; --ml: 18px;
  background:
    linear-gradient(var(--mc), var(--mc)) 0 0 / var(--ml) var(--mt) no-repeat,
    linear-gradient(var(--mc), var(--mc)) 0 0 / var(--mt) var(--ml) no-repeat,
    linear-gradient(var(--mc), var(--mc)) 100% 0 / var(--ml) var(--mt) no-repeat,
    linear-gradient(var(--mc), var(--mc)) 100% 0 / var(--mt) var(--ml) no-repeat,
    linear-gradient(var(--mc), var(--mc)) 0 100% / var(--ml) var(--mt) no-repeat,
    linear-gradient(var(--mc), var(--mc)) 0 100% / var(--mt) var(--ml) no-repeat,
    linear-gradient(var(--mc), var(--mc)) 100% 100% / var(--ml) var(--mt) no-repeat,
    linear-gradient(var(--mc), var(--mc)) 100% 100% / var(--mt) var(--ml) no-repeat;
  opacity: 0; transform: scale(1.07);
  transition: opacity 0.26s ease, transform 0.32s cubic-bezier(0.2,0.9,0.25,1);
}
.pk-wl-card:hover .pk-wl-marks { opacity: 1; transform: scale(1); }

.pk-wl-tag {
  position: absolute; left: 14px; bottom: 14px; z-index: 2;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 10px;
  background: rgba(10,12,18,0.66); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.18);
  font-size: 0.71rem; font-weight: 800; letter-spacing: 0.2px; color: #fff;
  white-space: nowrap; pointer-events: none;
  opacity: 0; transform: translateY(7px);
  transition: opacity 0.26s ease, transform 0.26s cubic-bezier(0.2,0.9,0.25,1);
}
.pk-wl-card:hover .pk-wl-tag { opacity: 1; transform: translateY(0); }

/* The touch version: one quiet mark saying the tile leads somewhere, sized so
   it never competes with the picture. Hidden wherever hover exists. */
.pk-wl-glyph {
  position: absolute; right: 9px; bottom: 9px; z-index: 2; display: none;
  align-items: center; justify-content: center; width: 27px; height: 27px;
  border-radius: 9px; color: #fff;
  background: rgba(10,12,18,0.5); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
}

.pk-wl-flag {
  position: absolute; top: 10px; left: 10px; z-index: 1;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 30px;
  background: var(--accent-main); color: #fff;
  font-size: 0.63rem; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase;
}

.pk-wl-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding-inline: 2px; }
.pk-wl-name {
  font-size: 0.88rem; font-weight: 800; line-height: 1.35; color: var(--text-main);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pk-wl-sub { font-size: 0.72rem; color: var(--text-secondary); }

.pk-wl-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 60px 20px; text-align: center;
}
.pk-wl-empty-icon {
  width: 58px; height: 58px; border-radius: 18px; margin-bottom: 4px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(229,9,20,0.07); border: 1px solid rgba(229,9,20,0.18);
  color: var(--accent-main);
}
.pk-wl-empty strong { font-size: 1.05rem; font-weight: 800; color: var(--text-main); }
.pk-wl-empty span { font-size: 0.86rem; color: var(--text-secondary); max-width: 380px; }
.pk-wl-empty a, .pk-wl-empty button {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  margin-top: 8px; padding: 11px 22px; border-radius: 30px; border: none;
  background: var(--accent-main); color: #fff; text-decoration: none;
  font-size: 0.84rem; font-weight: 800;
}

/* No hover to reveal anything, so the brackets and the label would either sit
   there permanently — covering the picture they advertise — or never appear.
   The glyph says the same thing in a corner instead. */
@media (hover: none) {
  .pk-wl-marks, .pk-wl-tag { display: none; }
  .pk-wl-glyph { display: flex; }
}

/* The lift, the zoom and the hero's blur are decoration; nothing depends on
   them, and the blur in particular is a real cost on a low-end phone. */
@media (prefers-reduced-motion: reduce) {
  .pk-wl-thumb, .pk-wl-thumb img, .pk-wl-marks, .pk-wl-tag, .pk-wl-veil { transition: none; }
  .pk-wl-card:hover .pk-wl-marks { transform: none; }
  .pk-wl-card:hover .pk-wl-thumb { transform: none; }
  .pk-wl-card:hover .pk-wl-thumb img { transform: none; }
}

@media (max-width: 900px) {
  .pk-wl-bar { flex-direction: column; align-items: stretch; gap: 12px; }
  .pk-wl-seg { align-self: center; }
}

@media (max-width: 560px) {
  .pk-wl { padding: 16px var(--container-pad) 56px; }
  .pk-wl-hero { border-radius: 22px; padding: 34px 20px; margin-bottom: 18px; }
  .pk-wl-hero-bg { filter: blur(26px) saturate(1.2); }
  .pk-wl-hero h1 { letter-spacing: -1px; }
  .pk-wl-stats li { padding: 6px 12px; font-size: 0.72rem; }

  .pk-wl-seg { width: 100%; justify-content: stretch; }
  .pk-wl-segbtn { flex: 1; justify-content: center; min-height: 40px; padding: 8px 10px; }

  .pk-wl-gridwrap { --pk-gap: 12px; }
  .pk-wl-thumb { border-radius: 15px; }
  .pk-wl-glyph { right: 7px; bottom: 7px; width: 25px; height: 25px; border-radius: 8px; }
  .pk-wl-flag { top: 8px; left: 8px; padding: 4px 8px; font-size: 0.58rem; }
  .pk-wl-name { font-size: 0.82rem; }
}

@media (max-width: 380px) {
  .pk-wl-segbtn span { display: none; }
  .pk-wl-segbtn { gap: 0; }
}
`;
