"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X, Crown, Compass, ChevronRight } from '../Common/Icons';
import api from '@/lib/api';
import { isPromptGridPath } from '@/lib/searchScope';

// ─── Main Header ──────────────────────────────────────────────────────────────
const Header = ({ search, setSearch, filter, setFilter, showFilters, setShowFilters, onLogoClick, settings, isAdmin, onHeightChange }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  // Prompt codes are PK + 4 digits, so the code path is the common one: open on
  // the number pad and let the user switch to letters for a name search.
  const [numericMode, setNumericMode] = useState(true);

  const lastScrollY = useRef(0);
  const location = usePathname();
  // Both controls only filter the home grid, so they only exist there — see
  // lib/searchScope.js. Elsewhere the header is logo + Explore.
  const canFilterPrompts = isPromptGridPath(location);
  const headerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Backstop for expansions that don't come from openSearch (which focuses
  // inside the tap itself — iOS ignores a focus() that lands in a later task).
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    api.get('/website_categories').then(res => setCategories(res.data)).catch(console.error);

    setIsMobile(window.innerWidth <= 1100);
    const handleResize = () => setIsMobile(window.innerWidth <= 1100);
    window.addEventListener('resize', handleResize);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      // Pin the bar while search is open. Filtering collapses the page height,
      // the browser clamps scrollY to the new maximum, and each clamp fires a
      // scroll event — which the up/down test below read as real scrolling.
      if (isSearchExpanded) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Retracting the header reports a new height through onHeightChange, which
      // changes the layout's top padding, which nudges scrollY — a scroll event
      // the handler then reads as movement and reverses the decision on. That
      // loop is the flicker. Ignoring sub-threshold moves breaks it; genuine
      // scrolling accumulates past the threshold within a frame or two.
      const delta = currentScrollY - lastScrollY.current;
      if (Math.abs(delta) < 8) return;

      setIsVisible(currentScrollY <= 150 || delta < 0);
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

  // Results live in the page grid now, so dismissing the search UI must keep the
  // term — clearing it here would wipe the very results the user just asked for.
  const dismissSearch = () => {
    searchInputRef.current?.blur();
    setIsSearchExpanded(false);
  };

  // The X is a cancel, not a two-step clear-then-close: one tap always puts the
  // page back the way it was. Blur explicitly — the input stays mounted while
  // collapsed (see below), so dropping the bar alone won't dismiss the keyboard.
  const clearSearch = () => {
    searchInputRef.current?.blur();
    setSearch('');
    setIsSearchExpanded(false);
  };

  // The grid filters live behind the overlay, so start from the top — that is
  // where the results render.
  const openSearch = () => {
    setIsSearchExpanded(true);
    setNumericMode(true);
    // Smooth scrolling races the keyboard animation on phones and reads as jank.
    window.scrollTo({ top: 0, behavior: isMobile ? 'auto' : 'smooth' });

    const el = searchInputRef.current;
    if (el) {
      // React hasn't re-rendered yet and the keyboard only reads inputmode at
      // focus time, so set the attribute before focusing rather than after.
      el.setAttribute('inputmode', 'numeric');
      el.focus();
    }
  };

  const toggleKeyboardMode = () => {
    const next = !numericMode;
    setNumericMode(next);
    const el = searchInputRef.current;
    if (!el) return;
    el.setAttribute('inputmode', next ? 'numeric' : 'text');
    // Bounce focus so the soft keyboard re-reads the mode — still inside the
    // tap, which is the only time iOS will reopen it.
    el.blur();
    el.focus();
  };

  // A complete prompt code is the whole query, so stop asking for more input:
  // the number pad has no Enter key to dismiss itself with.
  // Leaving the grid takes the bar's reason to be open with it. AppContext
  // clears the term on the same transition.
  useEffect(() => {
    if (!canFilterPrompts) setIsSearchExpanded(false);
  }, [canFilterPrompts]);

  const isPromptCode = (v) => /^(pk)?\d{4}$/i.test((v || '').trim());
  const prevSearch = useRef(search);
  useEffect(() => {
    const was = prevSearch.current;
    prevSearch.current = search;
    if (!isSearchExpanded) return;
    if (isPromptCode(search) && !isPromptCode(was)) searchInputRef.current?.blur();
  }, [search, isSearchExpanded]);

  const mobileSearchActive = isMobile && isSearchExpanded;

  return (
    <>
      {/* ── Mobile search bar ───────────────────────────────────────────────
          Sits exactly on top of the header rather than covering the screen: the
          grid underneath has to stay visible so results filter live as you type.
          No backdrop for the same reason.

          Stays mounted while collapsed instead of being conditionally rendered.
          Mounting on tap meant the input didn't exist yet when the tap handler
          ran, so focus had to be deferred — and iOS only opens the keyboard for
          a focus() in the same task as the gesture. Keeping it mounted also
          gives the bar a real exit transition rather than popping out. */}
      {isMobile && canFilterPrompts && (
        <div
          aria-hidden={!isSearchExpanded}
          style={{
            position: 'fixed',
            top: '10px', left: '28px', right: '28px',
            zIndex: 3000,
            minHeight: '75px',
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(0,0,0,0.16)',
            borderRadius: '24px',
            opacity: isSearchExpanded ? 1 : 0,
            transform: isSearchExpanded ? 'translateY(0)' : 'translateY(-6px)',
            pointerEvents: isSearchExpanded ? 'auto' : 'none',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          <Search size={20} color="var(--accent-main)" style={{ flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            type="text"
            inputMode={numericMode ? 'numeric' : 'text'}
            enterKeyHint="search"
            autoComplete="off"
            tabIndex={isSearchExpanded ? 0 : -1}
            placeholder={numericMode ? 'Prompt code — e.g. 1234' : 'Prompt name…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') dismissSearch(); }}
            style={{
              flex: 1, minWidth: 0,
              background: 'transparent', border: 'none', outline: 'none',
              // Stays at/above 16px so iOS Safari doesn't zoom the page on focus.
              fontSize: '1.05rem', fontWeight: 600,
              color: 'var(--text-main)',
            }}
          />
          {/* The number pad has no letter keys, so name search needs a way back. */}
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); toggleKeyboardMode(); }}
            aria-label={numericMode ? 'Search by name' : 'Search by prompt code'}
            style={{
              height: '32px', padding: '0 10px', borderRadius: '10px',
              background: 'rgba(0,0,0,0.06)', border: 'none', flexShrink: 0,
              fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {numericMode ? 'ABC' : '123'}
          </button>
          {/* Close means close — one tap drops the bar and the filter together,
              so the grid can never stay filtered by a bar that isn't showing. */}
          <div
            onClick={clearSearch}
            aria-label="Close search"
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(0,0,0,0.06)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} color="var(--text-secondary)" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInBackdrop { from { opacity: 0; } to { opacity: 1; } }
        .header-search-full {
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>

      <header ref={headerRef} className="responsive-header" style={{
        boxShadow: isScrolled ? '0 20px 40px rgba(17, 24, 39, 0.1)' : 'none',
        // Fill and outline fade on the search bar's 0.2s clock, not the 0.4s
        // show/hide one — mismatched timings made the bar underneath visibly
        // dissolve before the new one arrived.
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease, border-color 0.2s ease',
        transform: isVisible ? 'translateY(0)' : 'translateY(-120%)',
        opacity: isVisible ? 1 : 0,
        zIndex: 999,
        // The mobile search bar lays its own bordered box over this one. Two
        // hairlines a pixel apart read as a double border, so drop this one's
        // outline and fill while it is covered.
        ...(mobileSearchActive && {
          borderColor: 'transparent',
          background: 'transparent',
        }),
      }}>
        {/* The search group carries the marginLeft:auto that pushes Explore to the
            right edge. Without it in the row, space-between does that job. */}
        <div className="header-inner-flex" style={{ justifyContent: canFilterPrompts ? 'flex-start' : 'space-between', position: 'relative' }}>

          {/* ── Logo ─────────────────────────────────────── */}
          <div className="header-logo-container" style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '30px',
            order: 1,
            maxWidth: '200px',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <Link href="/" onClick={onLogoClick} className="header-logo-link">
              <img src="/promptking-logo.svg" alt="PromptKing Logo" className="site-logo header-logo-img" />
            </Link>
          </div>

          {/* ── Search + Premium group ─────────────────────
              Home only: both controls filter the grid that lives on that route
              and nothing else, so off it they'd be inert chrome. */}
          {canFilterPrompts && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: 'auto',
            order: 2,
            flexShrink: 0,
            position: 'relative',
          }}>

            {/* Premium Icon */}
            <button
              onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
              className="premium-header-btn"
              title="Premium Prompts"
              style={{
                background: filter === 'premium' ? 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)' : 'rgba(245, 158, 11, 0.12)',
                border: filter === 'premium' ? '1px solid #d97706' : '1px solid rgba(245, 158, 11, 0.3)',
                width: isMobile ? '42px' : '50px',
                height: isMobile ? '42px' : '50px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                flexShrink: 0,
                boxShadow: filter === 'premium' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none',
              }}
            >
              <Crown
                size={isMobile ? 18 : 20}
                fill={filter === 'premium' ? '#451a03' : '#F59E0B'}
                style={{
                  display: 'block',
                  color: filter === 'premium' ? '#451a03' : '#d97706',
                  transition: 'all 0.3s ease',
                }}
              />
            </button>

            {/* ── Search trigger ──────────────────────────── */}
            {isMobile ? (
              /* Phones get a full-screen sheet instead of a bar squeezed into the
                 header — see the overlay below. This is just its trigger. */
              <button
                onClick={openSearch}
                aria-label="Search prompts"
                className="search-bar-hover"
                style={{
                  width: '42px', height: '42px',
                  borderRadius: '16px',
                  background: search ? 'rgba(229,9,20,0.08)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${search ? 'rgba(229,9,20,0.25)' : 'rgba(0,0,0,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.25s ease',
                }}
              >
                <Search size={19} color={search ? 'var(--accent-main)' : 'var(--text-secondary)'} />
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <div
                  className="search-bar-hover header-search-full"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: isSearchExpanded ? 'rgba(255,255,255,0.98)' : 'rgba(0,0,0,0.03)',
                    borderRadius: '16px',
                    padding: isSearchExpanded ? '8px 8px 8px 16px' : '7px',
                    borderWidth: isSearchExpanded ? '1.5px' : '1px',
                    borderStyle: 'solid',
                    borderColor: isSearchExpanded ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.08)',
                    width: isSearchExpanded ? '340px' : '50px',
                    flexShrink: 0,
                    height: '50px',
                    cursor: isSearchExpanded ? 'text' : 'pointer',
                    transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), background 0.25s ease, padding 0.3s ease, border-color 0.25s ease',
                  }}
                  onClick={() => { if (!isSearchExpanded) openSearch(); }}
                  // The input is untabbable while collapsed — it is invisible, and
                  // tabbing into it meant typing into nothing. The closed pill takes
                  // the focus instead and opens on Enter.
                  role={isSearchExpanded ? undefined : 'button'}
                  aria-label={isSearchExpanded ? undefined : 'Search prompts'}
                  tabIndex={isSearchExpanded ? -1 : 0}
                  onKeyDown={(e) => {
                    if (isSearchExpanded) return;
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSearch(); }
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    width: isSearchExpanded ? '26px' : '36px',
                    height: isSearchExpanded ? '26px' : '36px',
                    transition: 'all 0.3s ease',
                  }}>
                    <Search size={18} color={isSearchExpanded ? 'var(--accent-main)' : 'var(--text-secondary)'} />
                  </div>

                  <input
                    ref={searchInputRef}
                    type="text"
                    autoComplete="off"
                    tabIndex={isSearchExpanded ? 0 : -1}
                    placeholder="Search prompts or code…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    onBlur={() => {
                      // Only collapse an empty bar; a live term stays visible so the
                      // user can see what the grid below is filtered by.
                      setTimeout(() => { if (!search) setIsSearchExpanded(false); }, 200);
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
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: 'var(--text-main)',
                      pointerEvents: isSearchExpanded ? 'auto' : 'none',
                    }}
                  />

                  {isSearchExpanded && (
                    <div
                      onPointerDown={(e) => { e.preventDefault(); clearSearch(); }}
                      aria-label="Close search"
                      style={{
                        width: '32px', height: '32px',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <X size={16} color="var(--text-secondary)" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}


          {/* ── Explore / Actions ─────────────────────────── */}
          <div className="header-actions" style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '10px',
            order: 3,
            flexShrink: 0,
            maxWidth: '300px',
            overflow: 'hidden',
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
