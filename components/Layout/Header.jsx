"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, Crown, Compass, ChevronRight, ArrowRight } from '../Common/Icons';
import { optimizeImage } from '@/utils/imageUtils';
import api from '@/lib/api';

// ─── Small Search Result Item ─────────────────────────────────────────────────
const SearchResultItem = ({ prompt, searchTerm, onClose }) => {
  const title = prompt.title || prompt.prompt_key || '';
  const img = prompt.thumbnail_url || prompt.imgAfter || prompt.img_after || prompt.imgBefore || prompt.img_before;

  // Highlight matching text
  const highlight = (text) => {
    if (!searchTerm || !text) return text;
    const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(229,9,20,0.15)', color: 'var(--accent-main)', borderRadius: '3px', padding: '0 2px' }}>
          {text.slice(idx, idx + searchTerm.length)}
        </mark>
        {text.slice(idx + searchTerm.length)}
      </>
    );
  };

  return (
    <Link
      href={`/prompt/${prompt.slug || prompt.prompt_key || prompt.key}`}
      onClick={onClose}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        className="search-result-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '14px',
          transition: 'background 0.18s ease',
          cursor: 'pointer',
        }}
      >
        {/* Thumbnail */}
        {img ? (
          <div style={{
            width: '52px', height: '40px', borderRadius: '10px',
            overflow: 'hidden', flexShrink: 0,
            background: '#f1f5f9',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <img
              src={optimizeImage(img, 120)}
              alt={title}
              width="52" height="40"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="eager"
            />
          </div>
        ) : (
          <div style={{
            width: '52px', height: '40px', borderRadius: '10px',
            background: 'rgba(229,9,20,0.08)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(229,9,20,0.12)',
          }}>
            <Search size={16} color="var(--accent-main)" />
          </div>
        )}

        {/* Title + AI type */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.9rem', fontWeight: 600,
            color: 'var(--text-main)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {highlight(title)}
          </div>
          {prompt.aiType && (
            <div style={{
              fontSize: '0.72rem', fontWeight: 500,
              color: 'var(--text-secondary)',
              marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {prompt.aiType}
            </div>
          )}
        </div>

        {/* Arrow */}
        <ArrowRight size={14} color="var(--text-dim, rgba(0,0,0,0.3))" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
};

// ─── Main Header ──────────────────────────────────────────────────────────────
const Header = ({ search, setSearch, filter, setFilter, showFilters, setShowFilters, onLogoClick, settings, isAdmin, onHeightChange }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [allPrompts, setAllPrompts] = useState([]);

  const lastScrollY = useRef(0);
  const navigate = useRouter();
  const location = usePathname();
  const isHomePage = location === '/';
  const headerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchExpanded]);

  // Load prompts for live search results
  useEffect(() => {
    api.get('/get_data?light=1')
      .then(res => setAllPrompts(res.data?.prompts || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/website_categories').then(res => setCategories(res.data)).catch(console.error);

    setIsMobile(window.innerWidth <= 1100);
    const handleResize = () => setIsMobile(window.innerWidth <= 1100);
    window.addEventListener('resize', handleResize);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY.current && !isSearchExpanded) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      setIsScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return;
        for (let entry of entries) {
          if (onHeightChange) {
            onHeightChange(entry.target.offsetHeight + (isMobile ? 10 : 20));
          }
        }
      });
    });

    if (headerRef.current) resizeObserver.observe(headerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [onHeightChange, isMobile, isSearchExpanded]);

  // ── Live search results (top 6 matches) ──────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!search || search.trim().length < 1) return [];
    const q = search.toLowerCase();
    return allPrompts
      .filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.prompt_key || '').toLowerCase().includes(q) ||
        (p.aiType || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [search, allPrompts]);

  const showDropdown = isSearchExpanded && search.trim().length > 0;

  const closeSearch = () => {
    setIsSearchExpanded(false);
    setSearch('');
  };

  const mobileSearchActive = isMobile && isSearchExpanded;

  return (
    <>
      {/* Full-screen backdrop blur on mobile search */}
      {mobileSearchActive && (
        <div
          onClick={closeSearch}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: 'fadeInBackdrop 0.25s ease',
          }}
        />
      )}

      <style>{`
        @keyframes fadeInBackdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDownPanel { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .search-result-item:hover { background: rgba(0,0,0,0.04); }
        .header-search-full {
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>

      <header ref={headerRef} className="responsive-header" style={{
        boxShadow: isScrolled ? '0 20px 40px rgba(17, 24, 39, 0.1)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-120%)',
        opacity: isVisible ? 1 : 0,
        zIndex: 999,
      }}>
        <div className="header-inner-flex" style={{ justifyContent: 'flex-start', position: 'relative' }}>

          {/* ── Logo ─────────────────────────────────────── */}
          <div className="header-logo-container" style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '30px',
            order: 1,
            transition: 'opacity 0.3s ease, transform 0.3s ease, max-width 0.35s ease',
            opacity: mobileSearchActive ? 0 : 1,
            transform: mobileSearchActive ? 'translateX(-10px)' : 'translateX(0)',
            maxWidth: mobileSearchActive ? '0' : '200px',
            overflow: 'hidden',
            pointerEvents: mobileSearchActive ? 'none' : 'auto',
            flexShrink: 0,
          }}>
            <Link href="/" onClick={onLogoClick} className="header-logo-link">
              <img src="/promptking-logo.svg" alt="PromptKing Logo" className="site-logo header-logo-img" />
            </Link>
          </div>

          {/* ── Search + Premium group ───────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: 'auto',
            order: 2,
            flexShrink: 0,
            flex: mobileSearchActive ? '1' : 'none',
            transition: 'flex 0.35s ease',
            position: 'relative',
          }}>

            {/* Premium Icon */}
            <button
              onClick={() => {
                setFilter(filter === 'premium' ? 'all' : 'premium');
                if (!isHomePage) navigate.push('/');
              }}
              className="pro-card-hover"
              title="Premium Prompts"
              style={{
                background: filter === 'premium' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'rgba(0,0,0,0.03)',
                border: filter === 'premium' ? '1px solid #0f172a' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: filter === 'premium' ? '0 8px 20px rgba(15, 23, 42, 0.25)' : 'none',
                width: isMobile ? '42px' : '50px',
                height: isMobile ? '42px' : '50px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease, opacity 0.3s ease, transform 0.3s ease, max-width 0.35s ease',
                flexShrink: 0,
                opacity: mobileSearchActive ? 0 : 1,
                transform: mobileSearchActive ? 'scale(0.7)' : 'scale(1)',
                maxWidth: mobileSearchActive ? '0' : '60px',
                overflow: 'hidden',
                padding: mobileSearchActive ? '0' : undefined,
                pointerEvents: mobileSearchActive ? 'none' : 'auto',
              }}
            >
              <Crown
                size={isMobile ? 18 : 20}
                fill={filter === 'premium' ? '#f59e0b' : 'rgba(245, 158, 11, 0.18)'}
                style={{
                  display: 'block',
                  color: filter === 'premium' ? '#ffb703' : '#d97706',
                  filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.35))',
                  transition: 'all 0.25s ease',
                }}
              />
            </button>

            {/* ── Collapsible Search ──────────────────────── */}
            <div style={{ position: 'relative', flex: mobileSearchActive ? '1' : 'none', transition: 'flex 0.35s ease' }}>
              <div
                className="search-bar-hover header-search-full"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isSearchExpanded ? 'rgba(255,255,255,0.98)' : 'rgba(0,0,0,0.03)',
                  borderRadius: isSearchExpanded ? '18px 18px 0 0' : '16px',
                  padding: isSearchExpanded ? '8px 8px 8px 16px' : (isMobile ? '5px' : '7px'),
                  border: isSearchExpanded ? '1.5px solid rgba(0,0,0,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  borderBottom: isSearchExpanded && showDropdown ? '1.5px solid rgba(0,0,0,0.06)' : undefined,
                  overflow: 'visible',
                  width: isSearchExpanded ? (mobileSearchActive ? '100%' : '340px') : (isMobile ? '42px' : '50px'),
                  flexShrink: 0,
                  height: isMobile ? '48px' : '50px',
                  boxShadow: isSearchExpanded ? '0 2px 30px rgba(0,0,0,0.1)' : 'none',
                  cursor: isSearchExpanded ? 'text' : 'pointer',
                  transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), border-radius 0.3s ease, background 0.25s ease, box-shadow 0.3s ease, padding 0.3s ease, border 0.25s ease',
                  backdropFilter: isSearchExpanded ? 'blur(20px)' : 'none',
                  WebkitBackdropFilter: isSearchExpanded ? 'blur(20px)' : 'none',
                }}
                onClick={() => {
                  if (!isSearchExpanded) {
                    setIsSearchExpanded(true);
                    if (!isHomePage) navigate.push('/');
                  }
                }}
              >
                {/* Search Icon */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  width: isSearchExpanded ? '26px' : (isMobile ? '32px' : '36px'),
                  height: isSearchExpanded ? '26px' : (isMobile ? '32px' : '36px'),
                  borderRadius: '10px',
                  background: isSearchExpanded ? 'transparent' : 'transparent',
                  transition: 'all 0.3s ease',
                }}>
                  <Search size={isMobile ? 19 : 18} color={isSearchExpanded ? 'var(--accent-main)' : 'var(--text-secondary)'} />
                </div>

                {/* Input */}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={isMobile ? 'Search...' : 'Search prompts...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => {
                    // Small delay so click on result registers first
                    setTimeout(() => {
                      if (!search) {
                        setIsSearchExpanded(false);
                      }
                    }, 200);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    minWidth: 0,
                    opacity: isSearchExpanded ? 1 : 0,
                    padding: '0 8px',
                    transition: 'opacity 0.2s ease',
                    fontSize: isMobile ? '1rem' : '0.95rem',
                    fontWeight: 500,
                    color: 'var(--text-main)',
                    pointerEvents: isSearchExpanded ? 'auto' : 'none',
                  }}
                />

                {/* Clear / Close button */}
                {isSearchExpanded && (
                  <div
                    onPointerDown={(e) => {
                      e.preventDefault();
                      if (search) {
                        setSearch('');
                      } else {
                        setIsSearchExpanded(false);
                      }
                    }}
                    style={{
                      width: '32px', height: '32px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <X size={16} color="var(--text-secondary)" />
                  </div>
                )}
              </div>

              {/* ── Live Search Results Dropdown ──────────── */}
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'rgba(255,255,255,0.99)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  border: '1.5px solid rgba(0,0,0,0.09)',
                  borderTop: 'none',
                  borderRadius: '0 0 20px 20px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.13)',
                  zIndex: 1001,
                  overflow: 'hidden',
                  animation: 'slideDownPanel 0.2s ease',
                }}>
                  {searchResults.length > 0 ? (
                    <>
                      {/* Header row */}
                      <div style={{
                        padding: '10px 16px 6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                      }}>
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                      </div>

                      {/* Results list */}
                      <div style={{ padding: '6px' }}>
                        {searchResults.map((p) => (
                          <SearchResultItem
                            key={p.prompt_key || p.key || p.id}
                            prompt={p}
                            searchTerm={search}
                            onClose={() => {
                              setIsSearchExpanded(false);
                            }}
                          />
                        ))}
                      </div>

                      {/* View all */}
                      <div
                        style={{
                          padding: '10px 16px',
                          borderTop: '1px solid rgba(0,0,0,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setIsSearchExpanded(false);
                          if (!isHomePage) navigate.push('/');
                        }}
                      >
                        <span style={{
                          fontSize: '0.82rem', fontWeight: 700,
                          color: 'var(--accent-main)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '6px 14px', borderRadius: '30px',
                          background: 'rgba(229,9,20,0.07)',
                          border: '1px solid rgba(229,9,20,0.15)',
                          transition: 'background 0.2s',
                        }}>
                          See all results for "{search}" <ArrowRight size={12} />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                    }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
                      No prompts found for "<strong>{search}</strong>"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Explore / Actions ─────────────────────────── */}
          <div className="header-actions" style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '10px',
            order: 3,
            flexShrink: 0,
            transition: 'opacity 0.3s ease, transform 0.3s ease, max-width 0.35s ease',
            opacity: mobileSearchActive ? 0 : 1,
            transform: mobileSearchActive ? 'translateX(10px)' : 'translateX(0)',
            maxWidth: mobileSearchActive ? '0' : '300px',
            overflow: 'hidden',
            pointerEvents: mobileSearchActive ? 'none' : 'auto',
          }}>
            {categories.length > 0 && (
              <div
                className="category-dropdown-wrapper"
                onMouseEnter={() => !isMobile && setShowCategoryDropdown(true)}
                onMouseLeave={() => !isMobile && setShowCategoryDropdown(false)}
                onClick={() => isMobile && setShowCategoryDropdown(!showCategoryDropdown)}
                style={{ position: 'relative' }}
              >
                <div
                  className="explore-btn-hover"
                  style={{
                    color: 'rgba(20,22,26,0.8)',
                    background: 'rgba(0,0,0,0.03)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '50px',
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: showCategoryDropdown ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Compass size={18} style={{ display: 'block', color: 'var(--text-secondary)' }} />
                  Explore
                </div>
                {showCategoryDropdown && (
                  <div className="category-dropdown-menu" style={{
                    position: 'absolute', top: 'calc(100% + 15px)', right: 0,
                    background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                    border: '1px solid rgba(0,0,0,0.08)', borderRadius: '24px',
                    zIndex: 100,
                    boxShadow: '0 30px 60px rgba(17,24,39,0.16), 0 0 0 1px rgba(0,0,0,0.03)',
                    display: 'flex', flexDirection: 'column', gap: '16px',
                    transformOrigin: 'top right',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                      <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: 600 }}>Discover Categories</span>
                    </div>
                    <div className="category-grid">
                      {categories.map(c => (
                        <Link
                          key={c.id}
                          href={`/category/${c.slug}`}
                          onClick={() => setShowCategoryDropdown(false)}
                          style={{
                            color: 'rgba(20,22,26,0.9)', padding: '12px 16px', borderRadius: '16px',
                            textDecoration: 'none', transition: 'background 0.2s ease, border-color 0.2s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontSize: '0.95rem', fontWeight: 500,
                            background: 'rgba(0,0,0,0.025)',
                            border: '1px solid rgba(0,0,0,0.04)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.025)';
                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-main)', opacity: 0.8, boxShadow: '0 0 10px var(--accent-main)' }}></div>
                            {c.name}
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.07)', textAlign: 'center' }}>
                      <Link
                        href="/categories"
                        onClick={() => setShowCategoryDropdown(false)}
                        style={{
                          color: 'var(--accent-main)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px',
                          background: 'rgba(255, 193, 7, 0.1)', transition: '0.3s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 193, 7, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        View All Categories <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
