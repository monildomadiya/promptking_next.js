"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronUp } from '../Common/Icons';
import AdSenseUnit from '../Ads/AdSenseUnit';
import api from '@/lib/api';

const Footer = ({ onLogoClick }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState({ logo_url: '', logo_width_desktop: '150', logo_width_mobile: '120' });
  const [openSections, setOpenSections] = useState({
    platform: false,
    legal: false,
    newsletter: false
  });

  const currentYear = new Date().getFullYear();

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data) setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (section) => {
    if (!isMobile) return;
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const optimizeImage = (url, width = 600) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      return `/api/optimize?src=${encodeURIComponent(url)}&w=${width}`;
    }
    return url;
  };

  return (
    <>
      {settings?.adsense_enabled === '1' && settings?.adsense_slot_footer && (
        <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '0 20px', width: '100%' }}>
          <AdSenseUnit client={settings.adsense_client_id} slot={settings.adsense_slot_footer} />
        </div>
      )}
      <footer style={{
        background: '#ffffff',
        position: 'relative',
        padding: isMobile ? '56px 24px 36px' : '75px 54px 44px',
        color: 'var(--text-main)',
        maxWidth: '1360px',
        margin: isMobile ? '0 14px 24px' : '0 auto 40px',
        borderRadius: '36px',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden'
      }}>
        {/* ─── MAST RED GLOW EFFECT (Subtle, Refined Top Neon Line & Delicate Blush) ─── */}
        {/* 1. Sleek Neon Red Beam along Top Edge */}
        <div style={{
          position: 'absolute',
          top: 0, left: '18%', right: '18%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(229, 9, 20, 0.85) 50%, transparent 100%)',
          boxShadow: '0 0 16px rgba(229, 9, 20, 0.5)',
          zIndex: 2
        }} />

        {/* 2. Soft, Refined Ambient Red Blush (Blends smoothly into Pure White) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '12%',
          right: '12%',
          height: '190px',
          background: 'radial-gradient(ellipse at top center, rgba(229, 9, 20, 0.14) 0%, rgba(229, 9, 20, 0.04) 45%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '2.2fr 1fr 1fr 1.3fr', 
            gap: isMobile ? '36px' : '44px',
            marginBottom: '65px'
          }}>
            {/* Brand Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <Link href="/" onClick={onLogoClick} style={{
                color: 'var(--text-main)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <img
                  src="/promptking-logo.svg"
                  alt="PromptKing Logo"
                  width="48"
                  height="48"
                  style={{
                    height: isMobile ? '42px' : '48px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                />
                <span style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  letterSpacing: '-1.2px',
                  color: '#0f172a'
                }}>
                  PromptKing<span style={{ color: '#e50914' }}>.</span>
                </span>
              </Link>
              <p style={{ color: '#475569', lineHeight: 1.65, fontSize: '0.94rem', maxWidth: '370px', margin: 0 }}>
                The premium library for AI engineering and creative workflows. Discover, unlock, and share world-class prompts for ChatGPT, Midjourney, and Gemini.
              </p>

              {/* Red Live Status Indicator (Matching BruttoNetto Style) */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                <span style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#e50914',
                  boxShadow: '0 0 10px #e50914',
                  display: 'inline-block'
                }} />
                AI Alchemy Systems Operational • <span style={{ color: '#e50914' }}>v3.0</span>
              </div>
            </div>

            {/* Platform Section */}
            <div style={sectionWrapperStyle(isMobile)}>
              <div style={headerStyle(isMobile)} onClick={() => toggleSection('platform')}>
                <h4 style={columnTitleStyle(isMobile)}>Platform</h4>
                {isMobile && (openSections.platform ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
              </div>
              {( !isMobile || openSections.platform ) && (
                <ul style={listStyle}>
                  <FooterLink to="/blog" text="Our Blog" />
                  <FooterLink to="/faq" text="FAQ & Help" />
                  <FooterLink to="/about" text="About Us" />
                  <FooterLink to="/contact" text="Contact Us" />
                </ul>
              )}
            </div>

            {/* Legal Section */}
            <div style={sectionWrapperStyle(isMobile)}>
              <div style={headerStyle(isMobile)} onClick={() => toggleSection('legal')}>
                <h4 style={columnTitleStyle(isMobile)}>Legal</h4>
                {isMobile && (openSections.legal ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
              </div>
              {( !isMobile || openSections.legal ) && (
                <ul style={listStyle}>
                  <FooterLink to="/privacy" text="Privacy Policy" />
                  <FooterLink to="/privacy#5" text="Cookie Policy" />
                  <FooterLink to="/terms" text="Terms of Service" />
                  <FooterLink to="/disclaimer" text="Disclaimer" />
                  <FooterLink to="/adsense-policy" text="Ads Policy" />
                </ul>
              )}
            </div>

            {/* Newsletter Section */}
            <div style={sectionWrapperStyle(isMobile)}>
              <div style={headerStyle(isMobile)} onClick={() => toggleSection('newsletter')}>
                <h4 style={columnTitleStyle(isMobile)}>Newsletter</h4>
                {isMobile && (openSections.newsletter ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
              </div>
              {( !isMobile || openSections.newsletter ) && (
                <div>
                  <p style={{ color: '#475569', fontSize: '0.88rem', marginBottom: '18px', lineHeight: 1.55, margin: '0 0 16px' }}>
                    Expert AI prompts and workflows sent directly to your inbox.
                  </p>
                  <div style={{
                    position: 'relative',
                    background: '#ffffff',
                    borderRadius: '50px',
                    border: '1px solid rgba(229, 9, 20, 0.25)',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 4px 16px rgba(229, 9, 20, 0.05)',
                    transition: 'all 0.3s ease'
                  }} className="footer-input-wrapper">
                    <input
                      type="email"
                      placeholder="Enter email..."
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#0f172a',
                        outline: 'none',
                        fontSize: '0.86rem'
                      }}
                    />
                    <button style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e50914, #b80710)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(229, 9, 20, 0.35)',
                      transition: 'all 0.3s ease'
                    }} className="footer-submit-btn">
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{
            paddingTop: '26px',
            borderTop: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex', 
            justifyContent: isMobile ? 'center' : 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '18px',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              &copy; {currentYear} PromptKing. All rights reserved.
            </p>

            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.83rem', color: '#64748b' }}>
                <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
                <span>•</span>
                <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
                <span>•</span>
                <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .footer-input-wrapper:focus-within {
            border-color: #e50914 !important;
            box-shadow: 0 0 18px rgba(229, 9, 20, 0.15) !important;
          }
          .footer-submit-btn:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 20px rgba(229, 9, 20, 0.5) !important;
          }
          .footer-link-text:hover {
            color: #e50914 !important;
            transform: translateX(4px);
          }
        `}</style>
      </footer>
    </>
  );
};


const FooterLink = ({ to, text }) => (
  <li>
    <Link href={to || '/'} className="footer-link-text" style={{
      textDecoration: 'none',
      color: 'var(--text-muted)',
      fontSize: '0.95rem',
      transition: 'all 0.3s ease',
      display: 'inline-block'
    }}>
      {text}
    </Link>
  </li>
);

// Styles
const columnTitleStyle = (isMobile) => ({
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: isMobile ? 0 : '30px',
  color: 'var(--text-main)'
});

const sectionWrapperStyle = (isMobile) => ({
  borderBottom: isMobile ? '1px solid rgba(0,0,0,0.07)' : 'none',
  paddingBottom: isMobile ? '20px' : 0
});

const headerStyle = (isMobile) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: isMobile ? 'pointer' : 'default',
  marginBottom: isMobile ? 0 : '25px'
});

const listStyle = {
  listStyle: 'none',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginTop: '15px'
};

export default Footer;

