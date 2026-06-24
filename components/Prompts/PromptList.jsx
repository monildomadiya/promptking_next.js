"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PromptCard from './PromptCard';
import MagicKingIntro from './MagicKingIntro';
import Shimmer from '../Common/Shimmer';
import api from '@/lib/api';

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
const PromptList = ({ search, filter, setFilter, isMobile, initialPrompts = [], initialCategories = [] }) => {
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

  const hasFetched = useRef(false);
  const prevSearch = useRef(search);
  const prevFilter = useRef(filter);

  const itemsPerPage = isMobile ? 8 : 12;

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Skeleton loader (only when truly no data) ────────────────────────────────
  if (loading) {
    const skeletonCount = isMobile ? 4 : 12;
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', width: '100%', marginTop: '40px' }}>
        <div className="css-masonry-grid">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '24px',
              padding: '18px',
              border: '1px solid rgba(255,255,255,0.08)'
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '10px' : '0 20px', width: '100%', marginTop: '40px' }}>

      {/* Silent background revalidation indicator */}
      {isRevalidating && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          background: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '30px', padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
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
          <div key={p.prompt_key || p.id}>
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
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : 'white',
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
                <span key={`dots-${i}`} style={{ color: 'rgba(255,255,255,0.4)', padding: '0 4px' }}>…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => goToPage(item)}
                  style={{
                    background: currentPage === item ? 'var(--accent-main)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
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
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : 'white',
              padding: '8px 18px', borderRadius: '12px', fontWeight: 600,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
            }}
          >Next →</button>
        </div>
      )}

      {/* The Magic Ruler section */}
      <MagicKingIntro isMobile={isMobile} />
    </div>
  );
};

export default PromptList;
