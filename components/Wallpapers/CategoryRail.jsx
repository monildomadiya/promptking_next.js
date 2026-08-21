"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Grid, Search, X } from '@/components/Common/Icons';

/**
 * The category picker, built for the day there are two hundred of them.
 *
 * A wrapping row of chips is fine at four and unusable at forty: it grows
 * downwards, so the wallpapers — the thing the page is for — get pushed off
 * the first screen by a navigation control. So the row never wraps. It scrolls,
 * it says so at the edges, and past `BROWSE_AT` entries it grows a button that
 * opens the full list with a search box, which is the only interaction that
 * stays constant-time as the list grows.
 *
 * Everything degrades to nothing: one category renders one chip, no arrows, no
 * button, no dialog in the tree at all.
 */

/** Past this many, scrolling alone stops being a reasonable way to find one. */
const BROWSE_AT = 8;

/** Scroll positions within a pixel of the end count as the end. */
const EDGE = 2;

export default function CategoryRail({ categories = [], total = 0, active = 'all', onPick }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [open, setOpen] = useState(false);

  const readEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > EDGE, right: el.scrollLeft < max - EDGE });
  }, []);

  useEffect(() => {
    readEdges();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    // The rail's own width, not the window's: a scrollbar appearing elsewhere
    // on the page changes what fits without the viewport moving at all.
    const observer = new ResizeObserver(readEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [readEdges, categories.length]);

  // A category chosen from the dialog — or restored from ?category= on load —
  // is very often somewhere off-screen in a long rail. Bring it into view, so
  // the row always shows what it claims is selected.
  useEffect(() => {
    const el = trackRef.current;
    const chip = el?.querySelector('[data-on="true"]');
    if (!chip) return;
    chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const nudge = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    // Most of a screenful, not all of it: leaving a chip visible on both sides
    // of a page turn is what tells you the row moved rather than jumped.
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const pick = (slug) => {
    onPick(slug);
    setOpen(false);
  };

  const chip = (slug, name, count) => (
    <button
      key={slug}
      type="button"
      data-on={active === slug}
      className={`pk-cr-chip ${active === slug ? 'is-on' : ''}`}
      onClick={() => pick(slug)}
      aria-pressed={active === slug}
    >
      {name} <span>{count}</span>
    </button>
  );

  return (
    <div className={`pk-cr ${edges.left ? 'can-left' : ''} ${edges.right ? 'can-right' : ''}`}>
      <button
        type="button"
        className="pk-cr-arrow is-left"
        onClick={() => nudge(-1)}
        aria-label="Scroll categories left"
        tabIndex={-1}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="pk-cr-track" ref={trackRef} onScroll={readEdges}>
        {chip('all', 'All', total)}
        {categories.map((c) => chip(c.slug, c.name, c.count))}
      </div>

      <button
        type="button"
        className="pk-cr-arrow is-right"
        onClick={() => nudge(1)}
        aria-label="Scroll categories right"
        tabIndex={-1}
      >
        <ChevronRight size={16} />
      </button>

      {categories.length > BROWSE_AT && (
        <button type="button" className="pk-cr-more" onClick={() => setOpen(true)}>
          <Grid size={14} />
          <span>
            <span className="pk-cr-more-word">All </span>
            {categories.length}
          </span>
        </button>
      )}

      {open && (
        <CategoryDialog
          categories={categories}
          total={total}
          active={active}
          onPick={pick}
          onClose={() => setOpen(false)}
        />
      )}

      <style>{railStyles}</style>
    </div>
  );
}

/**
 * The full list, searchable.
 *
 * Search rather than pagination or an A-Z index: someone opening this already
 * knows the word they are looking for, and typing three letters is faster than
 * any amount of well-organised scrolling.
 */
function CategoryDialog({ categories, total, active, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // The dialog scrolls; the page behind it must not, or a flick on a phone
    // moves the wrong list.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(needle));
  }, [categories, query]);

  return (
    <div className="pk-cd-scrim" onClick={onClose} role="presentation">
      <div
        className="pk-cd"
        role="dialog"
        aria-modal="true"
        aria-label="All categories"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="pk-cd-head">
          <h2>
            Categories <span>{categories.length}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </header>

        <label className="pk-cd-search">
          <Search size={15} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search categories"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="pk-cd-list">
          {!query && (
            <button
              type="button"
              className={`pk-cd-row ${active === 'all' ? 'is-on' : ''}`}
              onClick={() => onPick('all')}
            >
              <strong>All wallpapers</strong>
              <span>{total}</span>
            </button>
          )}

          {matches.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`pk-cd-row ${active === c.slug ? 'is-on' : ''}`}
              onClick={() => onPick(c.slug)}
            >
              <strong>{c.name}</strong>
              <span>{c.count}</span>
            </button>
          ))}

          {matches.length === 0 && <p className="pk-cd-none">Nothing matches “{query}”.</p>}
        </div>
      </div>
    </div>
  );
}

const railStyles = `
.pk-cr { position: relative; display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }

/* One row, always. The fade is a mask rather than a gradient overlay so it
   works over whatever the page background happens to be, and it is only
   applied on the side that actually has more to show. */
.pk-cr-track {
  display: flex; gap: 8px; min-width: 0; flex: 1;
  overflow-x: auto; scrollbar-width: none;
  scroll-snap-type: x proximity;
  padding: 2px 0;
  --fade-l: 0px; --fade-r: 0px;
  mask-image: linear-gradient(90deg, transparent 0, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent 100%);
}
.pk-cr-track::-webkit-scrollbar { display: none; }
.pk-cr.can-left .pk-cr-track { --fade-l: 26px; }
.pk-cr.can-right .pk-cr-track { --fade-r: 26px; }

.pk-cr-chip {
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
  flex-shrink: 0; scroll-snap-align: start; white-space: nowrap;
  padding: 9px 16px; border-radius: 30px; min-height: 40px;
  background: var(--surface-0); border: 1px solid var(--border-color);
  font-size: 0.83rem; font-weight: 700; color: var(--text-main);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.pk-cr-chip span { font-size: 0.71rem; font-weight: 800; opacity: 0.5; font-variant-numeric: tabular-nums; }
.pk-cr-chip:hover { border-color: rgba(229,9,20,0.4); }
.pk-cr-chip.is-on { background: var(--accent-main); border-color: var(--accent-main); color: #fff; }
.pk-cr-chip.is-on span { opacity: 0.8; }

/* Arrows sit over the fade they explain. They are a convenience for a mouse —
   a trackpad, a touchscreen and the keyboard all scroll the row without them —
   which is why they are out of the tab order and gone on touch. */
.pk-cr-arrow {
  position: absolute; top: 50%; z-index: 2; translate: 0 -50%;
  display: none; align-items: center; justify-content: center;
  width: 30px; height: 30px; cursor: pointer;
  border-radius: 50%; border: 1px solid var(--border-color);
  background: var(--surface-0); color: var(--text-main);
}
.pk-cr-arrow:hover { border-color: var(--accent-main); color: var(--accent-main); }
.pk-cr-arrow.is-left { left: -6px; }
.pk-cr-arrow.is-right { right: -6px; }
.pk-cr.can-left .pk-cr-arrow.is-left,
.pk-cr.can-right .pk-cr-arrow.is-right { display: flex; }

.pk-cr-more {
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer; flex-shrink: 0;
  padding: 9px 15px; border-radius: 30px; min-height: 40px;
  background: var(--surface-2); border: 1px dashed var(--border-color);
  font-size: 0.8rem; font-weight: 800; color: var(--text-secondary);
  transition: border-color 0.2s ease, color 0.2s ease;
}
.pk-cr-more:hover { border-color: var(--accent-main); color: var(--accent-main); }

/* ── The full list ─────────────────────────────────────────────────────── */
.pk-cd-scrim {
  position: fixed; inset: 0; z-index: 120;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  background: rgba(8,10,16,0.55); backdrop-filter: blur(3px);
  animation: pk-cd-fade 0.18s ease;
}
.pk-cd {
  display: flex; flex-direction: column; width: 100%; max-width: 540px;
  max-height: min(74vh, 620px); overflow: hidden;
  border-radius: 22px; background: var(--surface-0);
  /* The scrim behind it is what separates the dialog from the page; a shadow
     would be stripped site-wide anyway. */
  border: 1px solid var(--border-color);
  animation: pk-cd-rise 0.2s cubic-bezier(0.2,0.8,0.2,1);
}

/* The header and the search bar keep their height; the list is the only part
   that gives. Without this, a hundred rows push past the dialog's max-height
   and the browser takes the difference out of every child — squashing a 46px
   search field to twenty. */
.pk-cd-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 18px 12px; flex-shrink: 0; }
.pk-cd-head h2 { margin: 0; font-size: 1.05rem; font-weight: 900; color: var(--text-main); letter-spacing: -0.3px; }
.pk-cd-head h2 span { font-size: 0.78rem; font-weight: 800; color: var(--text-secondary); margin-left: 4px; }
.pk-cd-head button {
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--surface-2); border: 1px solid var(--border-color); color: var(--text-main);
}
.pk-cd-head button:hover { border-color: var(--accent-main); color: var(--accent-main); }

.pk-cd-search {
  display: flex; align-items: center; gap: 9px; margin: 0 18px 12px; flex-shrink: 0;
  padding: 0 14px; border-radius: 13px; height: 46px;
  background: var(--surface-1); border: 1px solid var(--border-color);
  color: var(--text-secondary);
}
.pk-cd-search:focus-within { border-color: var(--accent-main); }
.pk-cd-search input {
  flex: 1; min-width: 0; height: 100%; border: 0; background: transparent; outline: none;
  font-size: 0.9rem; font-weight: 600; color: var(--text-main);
}
.pk-cd-search input::-webkit-search-cancel-button { -webkit-appearance: none; }

.pk-cd-list { flex: 1; min-height: 0; overflow-y: auto; padding: 0 12px 14px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
.pk-cd-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  width: 100%; cursor: pointer; text-align: left;
  padding: 12px 14px; border-radius: 12px; min-height: 48px;
  background: transparent; border: 1px solid transparent; color: var(--text-main);
}
.pk-cd-row:hover { background: var(--surface-1); }
.pk-cd-row.is-on { background: var(--accent-glow); border-color: rgba(229,9,20,0.28); }
.pk-cd-row strong { font-size: 0.9rem; font-weight: 700; }
.pk-cd-row.is-on strong { color: var(--accent-main); }
.pk-cd-row span { font-size: 0.76rem; font-weight: 800; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.pk-cd-none { padding: 22px 14px; margin: 0; font-size: 0.86rem; color: var(--text-secondary); text-align: center; }

@keyframes pk-cd-fade { from { opacity: 0; } }
@keyframes pk-cd-rise { from { opacity: 0; transform: translateY(14px); } }

@media (hover: none) {
  /* Nothing to point at, and the row already scrolls under a thumb. */
  .pk-cr-arrow { display: none !important; }
}

@media (max-width: 560px) {
  /* The button and the rail share one row on a phone, so the button gives up
     its word: the icon and the number say the same thing in half the width,
     and every pixel it returns is a pixel of scrollable categories. */
  .pk-cr-more-word { display: none; }
  .pk-cr-more { padding: 9px 13px; }
}

@media (max-width: 560px) {
  /* A dialog on a phone is a sheet: it comes up from the thumb rather than
     landing in the middle of the screen. */
  .pk-cd-scrim { padding: 0; align-items: flex-end; }
  .pk-cd {
    max-width: none; max-height: 82vh;
    border-radius: 22px 22px 0 0; border-bottom: 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    animation: pk-cd-sheet 0.24s cubic-bezier(0.2,0.8,0.2,1);
  }
  @keyframes pk-cd-sheet { from { transform: translateY(100%); } }
}

@media (prefers-reduced-motion: reduce) {
  .pk-cd-scrim, .pk-cd { animation: none; }
}
`;
