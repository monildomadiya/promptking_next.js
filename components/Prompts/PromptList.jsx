"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import PromptCard from './PromptCard';
import Shimmer from '../Common/Shimmer';
import AffiliateProductCard, { productCardStyles } from '../Affiliate/ProductCard';
import api from '@/lib/api';

// ─── Affiliate products in the grid ───────────────────────────────────────────
// A small seeded generator, so a page's product spots are random per visit but
// stay put while the visitor is on it — Math.random() in render would move the
// cards on every keystroke of an unrelated state change.
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * Where the products go on one page, as { afterIndex: product }.
 *
 * The page is cut into `count` equal stretches and each gets one product at a
 * random spot inside it — random, but never two side by side and never a page
 * where they all bunch at the top. The first one waits until after the first
 * row: products arrive a moment after the prompts, and a card appearing above
 * everything would shove the whole grid down under the reader.
 *
 * 28 prompts + 4 or 8 products fills whole rows of 4 (and 30 + 4/8 of 2), so
 * the last row stays as even as it was.
 */
const placeProducts = (pool, count, pageSize, shown, page, seed) => {
  if (!pool?.length || !count || !shown) return {};
  const rand = seeded(seed + page * 7919);
  const stretch = pageSize / count;
  const spots = {};
  let previous = 1; // so the first spot is at least index 3: after the first row
  for (let i = 0; i < count; i += 1) {
    // At least one prompt between two products, even when a stretch is short.
    const from = Math.max(Math.floor(i * stretch), previous + 2);
    const to = Math.max(from, Math.floor((i + 1) * stretch) - 1);
    const at = from + Math.floor(rand() * (to - from + 1));
    if (at >= shown) break;
    previous = at;
    // Continue through the shuffled pool page after page, so page 2 does not
    // simply repeat page 1's products.
    spots[at] = pool[((page - 1) * count + i) % pool.length];
  }
  return spots;
};

// ─── Module-level memory cache ────────────────────────────────────────────────
// Persists for the entire browser session (survives component unmount/remount).
// This is the key fix: back navigation reuses this data instantly, no blink.
let _cachedPrompts = null;
let _cachedCategories = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const isCacheFresh = () => Date.now() - _cacheTimestamp < CACHE_TTL_MS;

const readCache = () => {
  if (_cachedPrompts && isCacheFresh()) return { prompts: _cachedPrompts, categories: _cachedCategories || [] };
  return null;
};

const writeCache = (prompts, categories) => {
  _cachedPrompts = prompts;
  _cachedCategories = categories;
  _cacheTimestamp = Date.now();
};

// Saved page persists across navigation without triggering a re-render on read
let _savedPage = 1;

// ─── Component ─────────────────────────────────────────────────────────────────
const PromptList = ({ search, filter, setFilter, isMobile, initialPrompts = [], initialCategories = [], settings }) => {
  // Seed from SSR data OR module cache immediately — never start empty if we have data
  const getInitialPrompts = () => {
    if (initialPrompts.length > 0) return initialPrompts;
    const mem = readCache();
    return mem ? mem.prompts : [];
  };

  const getInitialCategories = () => {
    if (initialCategories.length > 0) return initialCategories;
    const mem = readCache();
    return mem ? mem.categories : [];
  };

  const [prompts, setPrompts] = useState(getInitialPrompts);
  const [categories, setCategories] = useState(getInitialCategories);

  // Only show loading skeleton if we truly have no data at all
  const hasInitialData = initialPrompts.length > 0 || readCache() !== null;
  const [loading, setLoading] = useState(!hasInitialData);
  const [isRevalidating, setIsRevalidating] = useState(false);

  const [activeUnlockedKey, setActiveUnlockedKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => _savedPage);

  // Affiliate products for the grid. Fetched after mount on purpose: the grid is
  // server-rendered, and a random placement there could never match the
  // browser's, so the products join once the page is already interactive.
  const [affiliate, setAffiliate] = useState(null);
  useEffect(() => {
    let alive = true;
    api.get('/affiliate_products')
      .then(({ data }) => {
        if (!alive || !data?.enabled || !data.gridCount || !data.products?.length) return;
        // Featured products go into the pool twice, so they turn up more often
        // without crowding everything else out.
        const pool = [...data.products, ...data.products.filter((x) => x.isFeatured)];
        for (let i = pool.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        setAffiliate({ pool, count: data.gridCount, seed: Math.floor(Math.random() * 1e9), disclosure: data.disclosure });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const hasFetched = useRef(false);
  const prevSearch = useRef(search);
  const prevFilter = useRef(filter);

  // Mobile deliberately carries more than desktop, which reads like a typo but
  // isn't: the phone grid is two columns of short cards, so 30 is fifteen rows
  // of thumb-scroll, while desktop's four-wide grid turns 28 into seven rows
  // that already overflow a screen. Both are multiples of their column count,
  // so neither leaves a ragged last row.
  const itemsPerPage = isMobile ? 30 : 28;

  // ── Fetch data from API ──────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRevalidating(true);

    try {
      const response = await api.get('/get_data');
      const newPrompts = response.data.prompts || [];
      const newCategories = response.data.categories || [];
      writeCache(newPrompts, newCategories);
      setPrompts(newPrompts);
      setCategories(newCategories);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      if (!silent) setLoading(false);
      else setIsRevalidating(false);
    }
  }, []);

  // ── Bootstrap data on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    if (initialPrompts.length > 0) {
      // Fresh SSR data — write to module cache, revalidate silently after 60s
      writeCache(initialPrompts, initialCategories);
      const timer = setTimeout(() => fetchData(true), 60_000);
      return () => clearTimeout(timer);
    }

    const mem = readCache();
    if (mem) {
      // Module cache hit — already seeded in useState, just revalidate silently
      fetchData(true);
    } else {
      // Cold start — fetch and show skeleton
      fetchData(false);
    }
  }, []);

  // ── Persist current page to module-level var (no state update on read) ───────
  useEffect(() => {
    _savedPage = currentPage;
  }, [currentPage]);

  // ── Reset page when search/filter changes ────────────────────────────────────
  useEffect(() => {
    if (search !== prevSearch.current || filter !== prevFilter.current) {
      setCurrentPage(1);
      prevSearch.current = search;
      prevFilter.current = filter;
    }
  }, [search, filter]);

  // ── Filtered + sorted prompts ────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // The server-rendered payload omits promptText — it was 82% of the data and
  // most visitors only browse the grid. Search matches prompt bodies, so top up
  // the first time someone actually searches. Copying is handled per-card.
  const toppedUp = useRef(false);
  useEffect(() => {
    if (toppedUp.current || !debouncedSearch) return;
    if (!prompts.some(p => p.promptText === undefined)) return;
    toppedUp.current = true;
    fetchData(true);
  }, [debouncedSearch, prompts, fetchData]);

  const filteredPrompts = useMemo(() => {
    const safeSearch = (debouncedSearch || '').toLowerCase();
    return prompts
      .filter(p => {
        const matchesSearch =
          !safeSearch ||
          (p.prompt_key || '').toLowerCase().includes(safeSearch) ||
          (p.title || '').toLowerCase().includes(safeSearch) ||
          (p.prompt_text || p.promptText || '').toLowerCase().includes(safeSearch);

        let matchesFilter = true;
        if (filter === 'free') matchesFilter = !p.isPremium;
        else if (filter === 'premium') matchesFilter = p.isPremium;
        else if (filter !== 'all') matchesFilter = (p.aiType || '').toLowerCase().includes(filter);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0) || (a.prompt_key || '').localeCompare(b.prompt_key || '');
      });
  }, [prompts, debouncedSearch, filter]);

  const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
  const pagedPrompts = filteredPrompts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Not while searching: someone looking for a prompt wants results, and a
  // product among four matches reads as a wrong answer, not a suggestion.
  const productSpots = useMemo(
    () => (debouncedSearch
      ? {}
      : placeProducts(affiliate?.pool, affiliate?.count, itemsPerPage, pagedPrompts.length, currentPage, affiliate?.seed || 0)),
    [affiliate, debouncedSearch, itemsPerPage, pagedPrompts.length, currentPage]
  );

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Skeleton loader (only when truly no data) ────────────────────────────────
  if (loading) {
    const skeletonCount = isMobile ? 4 : 12;
    return (
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '20px', width: '100%', marginTop: '40px' }}>
        <div className="css-masonry-grid">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '18px',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              <Shimmer height={isMobile ? '140px' : '180px'} borderRadius="16px 16px 0 0" style={{ margin: '-18px -18px 15px -18px', width: 'calc(100% + 36px)' }} />
              <Shimmer height="18px" width="65%" style={{ marginBottom: '10px' }} />
              <Shimmer height="120px" width="100%" borderRadius="16px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    // marginBottom matches marginTop so the results sit evenly between whatever
    // is above and below them. On the unfiltered home page it collapses into the
    // features section's larger 80px top margin, so that spacing is unchanged.
    <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: isMobile ? '0 28px' : '0 20px', width: '100%', marginTop: '40px', marginBottom: '40px' }}>

      {/* Silent background revalidation indicator */}
      {isRevalidating && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '30px', padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(17,24,39,0.12)'
        }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--accent-main)',
            animation: 'pulse-revalidate 1.4s ease-in-out infinite'
          }} />
          Updating…
          <style>{`@keyframes pulse-revalidate{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.65)}}`}</style>
        </div>
      )}

      {/* Prompt Grid - CSS Masonry for SSR Hydration Fix */}
      <div className="css-masonry-grid">
        {pagedPrompts.map((p, idx) => (
          <React.Fragment key={p.prompt_key || p.id}>
            <div>
              <PromptCard
                prompt={p}
                isUnlocked={!p.isPremium || activeUnlockedKey === (p.prompt_key || p.id)}
                onUnlock={() => setActiveUnlockedKey(p.prompt_key || p.id)}
                onLock={() => setActiveUnlockedKey(null)}
                searchTerm={search}
                isHighlighted={!!search && (p.prompt_key || '').toLowerCase().includes(search.toLowerCase())}
                isPriority={idx < 8}
                isMobile={isMobile}
              />
            </div>
            {productSpots[idx] && (
              <div className="pk-grid-product">
                <AffiliateProductCard product={productSpots[idx]} compact sponsored />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {Object.keys(productSpots).length > 0 && (
        <>
          <style>{productCardStyles}</style>
          {/* The page with affiliate links on it has to say so, near the links —
              Amazon's agreement and ASCI both ask for it, not just /deals. */}
          {affiliate?.disclosure && (
            <p className="pk-aff-disclosure" style={{ margin: '18px 0 0', justifyContent: 'center', textAlign: 'center' }}>
              {affiliate.disclosure}
            </p>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.1)',
              color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
              padding: '8px 18px', borderRadius: '12px', fontWeight: 600,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
            }}
          >← Prev</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
            .reduce((acc, n, i, arr) => {
              if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
              acc.push(n);
              return acc;
            }, [])
            .map((item, i) =>
              item === '…' ? (
                <span key={`dots-${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => goToPage(item)}
                  style={{
                    background: currentPage === item ? 'var(--accent-main)' : 'rgba(0,0,0,0.04)',
                    border: currentPage === item ? '1px solid var(--accent-main)' : '1px solid rgba(0,0,0,0.1)',
                    color: currentPage === item ? 'white' : 'var(--text-main)',
                    padding: '8px 14px', borderRadius: '10px', fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: currentPage === item ? '0 0 14px rgba(229,9,20,0.4)' : 'none',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    transition: 'all 0.2s ease',
                  }}
                >{item}</button>
              )
            )
          }

          <button
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.1)',
              color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
              padding: '8px 18px', borderRadius: '12px', fontWeight: 600,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
            }}
          >Next →</button>
        </div>
      )}

    </div>
  );
};

export default PromptList;
