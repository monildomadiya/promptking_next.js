"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, Layout, Menu, X, Filter, Crown, Layers, ChevronDown, Camera, Activity, Coffee } from '../Common/Icons';
import AdSenseUnit from '../Ads/AdSenseUnit';

const Header = ({ search, setSearch, filter, setFilter, showFilters, setShowFilters, onLogoClick, settings, isAdmin, onHeightChange }) => {
  const [logoError, setLogoError] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 1100 : false);
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
    const handleResize = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 1100 : false);
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
      <header ref={headerRef} style={{
        position: 'fixed',
        top: isMobile ? '10px' : '20px',
        left: 0,
        right: 0,
        margin: '0 auto',
        width: isMobile ? 'calc(100% - 20px)' : 'calc(100% - 40px)',
        maxWidth: '1400px',
        zIndex: 2000,
        background: 'rgba(10, 10, 15, 0.7)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: isMobile ? '10px 15px' : '12px 20px',
        boxShadow: isScrolled ? '0 20px 40px rgba(0, 0, 0, 0.4)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-120%)',
        opacity: isVisible ? 1 : 0,
        minHeight: isMobile ? '65px' : 'auto',
        height: 'auto'
      }}>
        <div style={{ 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'relative',
          gap: isMobile ? '8px' : '40px'
        }}>
          <div style={{ 
            display: (isMobile && isSearchExpanded) ? 'none' : 'flex', 
            alignItems: 'center', 
            flex: '0 0 auto', 
            zIndex: 20,
            minWidth: isMobile ? '130px' : 'fit-content',
            flexShrink: 0,
            overflow: 'visible'
          }}>
            <Link 
              href="/" 
              onClick={onLogoClick}
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                minHeight: isMobile ? '32px' : '50px',
                minWidth: isMobile ? '100px' : 'fit-content'
              }}
            >
              {settings.logo_url && 
               settings.logo_url !== 'null' && 
               settings.logo_url !== 'undefined' && 
               settings.logo_url !== '' && 
               !logoError ? (
                <img 
                  src={optimizeImage(settings.logo_url, 400)} 
                  alt="PromptKing" 
                  onError={() => {
                    console.warn("Logo failed to load, switching to text fallback");
                    setLogoError(true);
                  }}
                  style={{ 
                    height: isMobile 
                      ? (settings.logo_height_mobile || '32px') 
                      : (settings.logo_height_desktop || '50px'),
                    maxHeight: isMobile ? '75px' : '100%',
                    width: isMobile 
                      ? (settings.logo_width_mobile || 'auto')
                      : (settings.logo_width_desktop || 'auto'),
                    objectFit: 'contain',
                    display: 'block',
                    transition: 'all 0.3s ease'
                  }} 
                  className="site-logo"
                />
              ) : (
                <span className="header-logo-text" style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>PromptKing</span>
              )}
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
                      if (window.location !== '/') {
                        navigate('/');
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
                  className="coffee-btn-hover"
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
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  <Coffee size={18} />
                  <span>Buy me a coffee</span>
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


