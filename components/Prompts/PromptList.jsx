"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PromptCard from './PromptCard';
import MagicKingIntro from './MagicKingIntro';
import Shimmer from '../Common/Shimmer';
import api from '@/lib/api';
import { Search, Crown, Grid, MessageSquare, Sparkles, Image, Zap, Filter, X } from '../Common/Icons';

const CACHE_KEY = 'pk_prompts_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null; // stale
    return data;
  } catch { return null; }
};

const setCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
};

const PromptList = ({ search, filter, setFilter, showFilters, isMobile, initialPrompts = [], initialCategories = [] }) => {
  // Always start with loading=true to match server-rendered HTML (avoids hydration mismatch).
  // Cache is read client-side only in useEffect.
  const [prompts, setPrompts] = useState(initialPrompts);
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(initialPrompts.length === 0);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [activeUnlockedKey, setActiveUnlockedKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPage = sessionStorage.getItem('pk_current_page');
        if (savedPage) return parseInt(savedPage, 10);
      } catch {}
    }
    return 1;
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const itemsPerPage = isMobile ? 8 : 9;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);
  const hasFetched = useRef(false);

  // Removed the useEffect that read from sessionStorage since it's now handled in useState

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFilterOpen]);

  const fetchData = useCallback(async (silent = false) => {
    if (silent) setIsRevalidating(true);
    else setLoading(true);
    try {
      const response = await api.get('/get_data');
      const newData = { prompts: response.data.prompts, categories: response.data.categories || [] };
      setCache(newData);
      setPrompts(newData.prompts);
      setCategories(newData.categories);
      if (!silent) {
        setTimeout(() => setFadeIn(true), 50); // trigger fade-in
      }
    } catch (error) {
      console.error("Failed to fetch prompts", error);
    } finally {
      if (silent) setIsRevalidating(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    if (initialPrompts.length > 0) {
      // We have fresh SSR data — skip the immediate revalidation.
      // Schedule a background revalidation after 60 seconds (matches server revalidate = 60).
      const timer = setTimeout(() => fetchData(true), 60 * 1000);
      return () => clearTimeout(timer);
    }

    // Read cache here (client-only) to avoid server/client mismatch
    const cached = getCache();
    if (cached) {
      // Instantly show cached data, silently revalidate in background
      setPrompts(cached.prompts || []);
      setCategories(cached.categories || []);
      setLoading(false);
      setFadeIn(true);
      fetchData(true);
    } else {
      fetchData(false);
    }
  }, [fetchData, initialPrompts.length]);



  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const safeKey = (p.prompt_key || '').toLowerCase();
      const safeTitle = (p.title || '').toLowerCase();
      const safeText = (p.prompt_text || p.promptText || '').toLowerCase();
      const safeSearch = (debouncedSearch || '').toLowerCase();
      
      const matchesSearch = safeKey.includes(safeSearch) || 
                            safeTitle.includes(safeSearch) || 
                            safeText.includes(safeSearch);
      
      let matchesFilter = true;
      if (filter === 'free') {
        matchesFilter = !p.isPremium;
      } else if (filter === 'premium') {
        matchesFilter = p.isPremium;
      } else if (filter !== 'all') {
        matchesFilter = (p.aiType || '').toLowerCase().includes(filter);
      }
      
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      if (a.sort_order !== b.sort_order) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
      return (a.prompt_key || '').localeCompare(b.prompt_key || '');
    });
  }, [prompts, debouncedSearch, filter]);

  // Calculate counts for categories and types
  const filterCounts = useMemo(() => ({
    all: prompts.length,
    free: prompts.filter(p => !p.isPremium).length,
    premium: prompts.filter(p => p.isPremium).length,
    categories: categories.reduce((acc, cat) => {
      const catName = (cat.name || '').toLowerCase();
      acc[catName] = prompts.filter(p => (p.aiType || '').toLowerCase().includes(catName)).length;
      return acc;
    }, {})
  }), [prompts, categories]);

  useEffect(() => {
    const handleOpenFilters = () => setIsSidebarOpen(true);
    const handleReset = () => {
      setCurrentPage(1);
      setActiveUnlockedKey(null);
    };
    window.addEventListener('openFilters', handleOpenFilters);
    window.addEventListener('resetPagination', handleReset);
    return () => {
      window.removeEventListener('openFilters', handleOpenFilters);
      window.removeEventListener('resetPagination', handleReset);
    };
  }, []);

  const prevSearch = useRef(search);
  const prevFilter = useRef(filter);
  
  useEffect(() => {
    if (search !== prevSearch.current || filter !== prevFilter.current) {
      setCurrentPage(1);
      prevSearch.current = search;
      prevFilter.current = filter;
    }
  }, [search, filter]);

  useEffect(() => {
    try { sessionStorage.setItem('pk_current_page', currentPage); } catch {}
  }, [currentPage]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', width: '100%' }}>
        <div style={{ 
          display: 'block', 
          marginTop: '40px' 
        }}>
          <div className="css-masonry-grid" id="skeletonContainer">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} style={{ 
                background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Shimmer height={isMobile ? '140px' : '180px'} borderRadius="20px 20px 0 0" style={{ margin: '-18px -18px 15px -18px', width: 'calc(100% + 36px)' }} />
                <Shimmer height="20px" width="60%" style={{ marginBottom: '10px' }} />
                <Shimmer height="140px" width="100%" borderRadius="20px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '10px' : '0 20px', width: '100%',
      opacity: fadeIn ? 1 : 0,
      transform: fadeIn ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease'
    }}>
      {/* Background revalidation indicator */}
      {isRevalidating && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '30px', padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--accent-main)',
            animation: 'pulse-dot 1.2s ease-in-out infinite'
          }} />
          Refreshing…
          <style>{`@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }`}</style>
        </div>
      )}
      <div style={{ 
        display: 'block', 
        marginTop: '40px' 
      }}>
        <div className="grid-main-area" style={{ width: '100%' }}>
          
          <div className="css-masonry-grid" style={{ marginTop: search ? '20px' : '0' }}>
            {filteredPrompts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p, index) => (
              <div key={p.prompt_key || p.id} style={{ width: '100%' }}>
                <PromptCard 
                  prompt={p} 
                  isUnlocked={!p.isPremium || activeUnlockedKey === (p.prompt_key || p.id)}
                  onUnlock={() => setActiveUnlockedKey(p.prompt_key || p.id)}
                  onLock={() => setActiveUnlockedKey(null)}
                  searchTerm={search}
                  isHighlighted={search && p.prompt_key && p.prompt_key.toLowerCase().includes(search.toLowerCase())}
                  isPriority={isMobile ? index < 4 : index < 6}
                  isMobile={isMobile}
                />
              </div>
            ))}
          </div>

          {filteredPrompts.length > itemsPerPage && (() => {
            const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
            return (
            <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : 'white',
                  padding: isMobile ? '8px 12px' : '8px 16px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: currentPage === pageNum ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        padding: isMobile ? '8px 12px' : '8px 14px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: currentPage === pageNum ? '0 0 15px rgba(229, 9, 20, 0.4)' : 'none',
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 || 
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} style={{ color: 'rgba(255,255,255,0.5)', padding: '0 4px', fontSize: '0.9rem' }}>...</span>;
                }
                return null;
              })}

              <button 
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : 'white',
                  padding: isMobile ? '8px 12px' : '8px 16px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Next
              </button>
            </div>
            );
          })()}



          <MagicKingIntro isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
};

export default PromptList;
