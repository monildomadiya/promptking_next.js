"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, Crown, Coffee, Compass, ChevronRight } from '../Common/Icons';

import api from '@/lib/api';

const Header = ({ search, setSearch, filter, setFilter, showFilters, setShowFilters, onLogoClick, settings, isAdmin, onHeightChange }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  // Use ref for lastScrollY — avoids re-registering scroll listener on every scroll event
  const lastScrollY = useRef(0);
  const navigate = useRouter();
  const location = usePathname();
  const isHomePage = location === '/';
  const headerRef = useRef(null);

  const optimizeImage = (url, width = 600) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      return `/api/optimize?src=${encodeURIComponent(url)}&w=${width}`;
    }
    return url;
  };

  useEffect(() => {
    api.get('/website_categories').then(res => setCategories(res.data)).catch(console.error);
    
    setIsMobile(window.innerWidth <= 1100);
    const handleResize = () => setIsMobile(window.innerWidth <= 1100);
    window.addEventListener('resize', handleResize);
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Control header visibility based on scroll direction
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
      lastScrollY.current = currentScrollY; // update ref, no re-render
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

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
    // Only re-run if onHeightChange or isMobile reference changes — NOT on every scroll
  }, [onHeightChange, isMobile, isSearchExpanded]);

  return (
    <>
      <header ref={headerRef} className="responsive-header" style={{
        boxShadow: isScrolled ? '0 20px 40px rgba(17, 24, 39, 0.1)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-120%)',
        opacity: isVisible ? 1 : 0
      }}>
        <div className="header-inner-flex" style={{ justifyContent: 'flex-start' }}>
          <div className="header-logo-container" style={{ 
            display: (isMobile && isSearchExpanded) ? 'none' : 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '30px',
            order: 1
          }}>
            <Link 
              href="/" 
              onClick={onLogoClick}
              className="header-logo-link"
            >
              <img 
                src="/promptking-logo.svg"
                alt="PromptKing Logo" 
                className="site-logo header-logo-img"
              />
            </Link>
          </div>

          {/* Search + Premium group — pushed to right together */}
          <div style={{
            display: (isMobile && isSearchExpanded) ? 'none' : 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: 'auto',
            order: 2,
            flexShrink: 0
          }}>
            {/* Premium Icon Button */}
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
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
            >
              <Crown
                size={isMobile ? 18 : 20}
                fill={filter === 'premium' ? '#f59e0b' : 'rgba(245, 158, 11, 0.18)'}
                style={{
                  display: 'block',
                  color: filter === 'premium' ? '#ffb703' : '#d97706',
                  filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.35))',
                  transition: 'all 0.25s ease'
                }}
              />
            </button>

            {/* Collapsible Search */}
            <div className="search-bar-hover" style={{
              display: 'flex',
              alignItems: 'center',
              background: isSearchExpanded ? (isMobile ? '#f8fafc' : 'rgba(0,0,0,0.04)') : 'rgba(0,0,0,0.03)',
              borderRadius: '16px',
              padding: isSearchExpanded ? (isMobile ? '4px 4px 4px 12px' : '6px 6px 6px 16px') : (isMobile ? '5px' : '7px'),
              transition: 'max-width 0.35s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, padding 0.3s ease',
              cursor: isSearchExpanded ? 'text' : 'pointer',
              border: '1px solid rgba(0,0,0,0.08)',
              overflow: 'hidden',
              maxWidth: isSearchExpanded ? (isMobile ? '100%' : '280px') : (isMobile ? '44px' : '50px'),
              width: isSearchExpanded ? '100%' : 'auto',
              flexShrink: 0,
              height: isMobile ? '42px' : '50px'
            }} onClick={() => {
              if (!isSearchExpanded) {
                setIsSearchExpanded(true);
                if (!isHomePage) navigate.push('/');
              }
            }}>
              <input
                type="text"
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => {
                  if (!search) setIsSearchExpanded(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  minWidth: 0,
                  opacity: isSearchExpanded ? 1 : 0,
                  padding: '0',
                  transition: 'opacity 0.25s ease',
                  fontSize: isMobile ? '1rem' : '0.95rem',
                  color: 'var(--text-main)',
                  pointerEvents: isSearchExpanded ? 'auto' : 'none'
                }}
                ref={(input) => {
                  if (input && isSearchExpanded) input.focus();
                }}
              />
              {isSearchExpanded && search && (
                <div
                  onPointerDown={(e) => { e.preventDefault(); setSearch(''); }}
                  style={{
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={16} color="var(--text-secondary)" />
                </div>
              )}
              {isMobile && isSearchExpanded && !search && (
                <X
                  size={22}
                  color="var(--text-secondary)"
                  style={{ cursor: 'pointer', flexShrink: 0, marginRight: '8px' }}
                  onPointerDown={(e) => { e.preventDefault(); setIsSearchExpanded(false); }}
                />
              )}
              {/* Search Icon */}
              <div
                onPointerDown={(e) => e.preventDefault()}
                style={{
                  background: isSearchExpanded ? '#0f172a' : 'transparent',
                  borderRadius: '10px',
                  width: isMobile ? '32px' : '36px',
                  height: isMobile ? '32px' : '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <Search size={isMobile ? 20 : 18} color={isSearchExpanded ? '#fff' : 'var(--text-secondary)'} />
              </div>
            </div>
          </div>

          <div className="header-actions" style={{ display: (isMobile && isSearchExpanded) ? 'none' : 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', order: 3, flexShrink: 0 }}>

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
                    whiteSpace: 'nowrap'
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
                    transformOrigin: 'top right'
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
                            border: '1px solid rgba(0,0,0,0.04)'
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
                    
                    {/* View All Categories Link */}
                    <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.07)', textAlign: 'center' }}>
                      <Link 
                        href="/categories"
                        onClick={() => setShowCategoryDropdown(false)}
                        style={{
                          color: 'var(--accent-main)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px',
                          background: 'rgba(255, 193, 7, 0.1)', transition: '0.3s'
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


