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
        <div className="header-inner-flex">
          <div className="header-logo-container" style={{ 
            display: (isMobile && isSearchExpanded) ? 'none' : 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '30px'
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

          <div className="header-actions">
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
                            textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontSize: '0.95rem', fontWeight: 500,
                            background: 'rgba(0,0,0,0.025)',
                            border: '1px solid rgba(0,0,0,0.04)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                            e.currentTarget.style.color = 'var(--text-main)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.querySelector('.menu-icon').style.transform = 'translateX(4px)';
                            e.currentTarget.querySelector('.menu-icon').style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.025)';
                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
                            e.currentTarget.style.color = 'rgba(20,22,26,0.9)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.querySelector('.menu-icon').style.transform = 'translateX(0)';
                            e.currentTarget.querySelector('.menu-icon').style.opacity = '0.5';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-main)', opacity: 0.8, boxShadow: '0 0 10px var(--accent-main)' }}></div>
                            {c.name}
                          </div>
                          <ChevronRight size={16} className="menu-icon" style={{ opacity: 0.5, transition: '0.3s', color: 'var(--text-secondary)' }} />
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


