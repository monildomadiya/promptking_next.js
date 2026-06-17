"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, Layout, Menu, X, Filter, Crown, Layers, ChevronDown, Camera, Activity, Coffee } from '../Common/Icons';
import AdSenseUnit from '../Ads/AdSenseUnit';

const Header = ({ search, setSearch, filter, setFilter, showFilters, setShowFilters, onLogoClick, settings, isAdmin, onHeightChange }) => {
  const [logoError, setLogoError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [categories, setCategories] = useState([]);
  const navigate = useRouter();
  const location = usePathname();
  const isHomePage = location === '/';
  const headerRef = React.useRef(null);

  const optimizeImage = (url, width = 600) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      return `/api/optimize?src=${encodeURIComponent(url)}&w=${width}`;
    }
    return url;
  };

  useEffect(() => {
    setIsMobile(window.innerWidth <= 1100);
    const handleResize = () => setIsMobile(window.innerWidth <= 1100);
    window.addEventListener('resize', handleResize);
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Control header visibility based on scroll direction
      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY && !isSearchExpanded) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      
      setIsScrolled(currentScrollY > 20);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Fetch categories
    api.get('/categories').then(res => setCategories(res.data));

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (onHeightChange) {
          onHeightChange(entry.target.offsetHeight + (isMobile ? 10 : 20)); // Add the 'top' margin/buffer
        }
      }
    });

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [lastScrollY, onHeightChange, isMobile]);

  return (
    <>
      <header ref={headerRef} className="responsive-header" style={{
        boxShadow: isScrolled ? '0 20px 40px rgba(0, 0, 0, 0.4)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-120%)',
        opacity: isVisible ? 1 : 0
      }}>
        <div className="header-inner-flex">
          <div className="header-logo-container" style={{ 
            display: (isMobile && isSearchExpanded) ? 'none' : 'flex'
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

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '10px' : '20px',
            flex: isMobile && isSearchExpanded ? 1 : 'initial',
            justifyContent: 'flex-end',
            minWidth: 0
          }}>
            <div style={{ 
              flex: isMobile && isSearchExpanded ? 1 : 'initial',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              transition: 'all 0.3s ease',
              gap: '10px',
              minWidth: 0
            }}>
              {isMobile && !isSearchExpanded ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isHomePage && (
                    <button 
                      onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
                      className="pro-card-hover"
                      title="Premium Prompts"
                      aria-label="Filter Premium"
                      style={{ 
                        width: '38px', height: '38px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: filter === 'premium' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: filter === 'premium' ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                        color: filter === 'premium' ? '#FFC107' : 'rgba(255,255,255,0.7)',
                        transition: '0.3s',
                        backdropFilter: 'blur(10px)',
                        padding: 0
                      }}
                    >
                      <Crown size={18} fill={filter === 'premium' ? '#FFC107' : 'none'} style={{ display: 'block' }} />
                    </button>
                  )}
                  <a 
                    href="https://ko-fi.com/M5H720SAJV"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buy me a coffee"
                    aria-label="Buy me a coffee"
                    style={{ 
                      width: '38px', height: '38px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: 'rgba(255, 193, 7, 0.15)',
                      border: '1px solid rgba(255, 193, 7, 0.3)',
                      color: '#FFC107',
                      transition: '0.3s',
                      backdropFilter: 'blur(10px)',
                      padding: 0,
                      textDecoration: 'none'
                    }}
                    className="coffee-btn-hover"
                  >
                    <Coffee size={18} style={{ display: 'block' }} />
                  </a>
                    <div 
                      className="glass-button-secondary"
                      onClick={() => setIsSearchExpanded(true)}
                      aria-label="Open search"
                      role="button"
                      style={{ 
                        width: '38px', height: '38px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                    >
                      <Search size={18} />
                    </div>
                </div>
              ) : (
                <div style={{ 
                  width: isMobile && isSearchExpanded ? '100%' : (isMobile ? '0' : '350px'), 
                  position: 'relative', 
                  display: 'flex', 
                  alignItems: 'center',
                  flex: isMobile && isSearchExpanded ? 1 : 'initial'
                }}>
                  <Search 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '16px', 
                      color: 'var(--text-secondary)',
                      opacity: 0.6
                    }} 
                  />
                  <input 
                    type="text" 
                    autoFocus={isMobile && isSearchExpanded}
                    placeholder={isMobile ? "Search prompts..." : "Search prompts..."}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (!isHomePage) {
                        navigate.push('/');
                      }
                    }}
                    onBlur={() => {
                      if (isMobile && search.trim() === '') {
                        setIsSearchExpanded(false);
                      }
                    }}
                    className="glass-input"
                    style={{ 
                      width: '100%', 
                      padding: isMobile ? '10px 15px 10px 45px' : '12px 15px 12px 45px', 
                      borderRadius: '50px',
                      fontSize: isMobile ? '16px' : '0.9rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      height: isMobile ? '45px' : '48px'
                    }} 
                  />
                  {((isMobile && isSearchExpanded) || search) && (
                    <div 
                      onPointerDown={(e) => {
                        e.preventDefault(); 
                        setSearch('');
                        if (isMobile) setIsSearchExpanded(false);
                      }}
                      style={{ 
                        position: 'absolute', 
                        right: '5px', 
                        padding: '10px',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={20} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {isHomePage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
                      className="pro-card-hover"
                      title="Premium Prompts"
                      style={{ 
                        width: '42px', height: '42px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: filter === 'premium' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: filter === 'premium' ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                        color: filter === 'premium' ? '#FFC107' : 'rgba(255,255,255,0.7)',
                        transition: '0.3s',
                        backdropFilter: 'blur(10px)',
                        padding: 0
                      }}
                    >
                      <Crown size={20} fill={filter === 'premium' ? '#FFC107' : 'none'} style={{ display: 'block' }} />
                    </button>
                  </div>
                )}
                <a 
                  href="https://ko-fi.com/M5H720SAJV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="coffee-btn-hover desktop-coffee-btn"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    height: '42px', borderRadius: '21px', 
                    padding: '0 16px',
                    cursor: 'pointer',
                    background: 'rgba(255, 193, 7, 0.15)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    color: '#FFC107',
                    transition: '0.3s',
                    backdropFilter: 'blur(10px)',
                    textDecoration: 'none'
                  }}
                >
                  <Coffee size={20} style={{ display: 'block' }} />
                  <span className="hide-on-mobile" style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.5px' }}>Support Us</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Top Banner Ad - Policy Compliant Placement */}
      {settings?.adsense_enabled === '1' && settings?.adsense_slot_header && (
        <div style={{ 
          position: 'fixed', 
          top: isMobile ? '85px' : '130px', 
          left: 0, 
          right: 0, 
          zIndex: 900,
          background: 'rgba(0,0,0,0.2)',
          padding: '10px 0',
          backdropFilter: 'blur(10px)'
        }}>
          <AdSenseUnit client={settings.adsense_client_id} slot={settings.adsense_slot_header} />
        </div>
      )}
    </>
  );
};

export default Header;


