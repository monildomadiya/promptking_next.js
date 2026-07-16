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
      background: 'linear-gradient(to bottom, #ffffff, var(--surface-0))',
      position: 'relative',
      padding: isMobile ? '60px 20px 40px' : '100px 40px 40px',
      minHeight: isMobile ? '600px' : '400px',
      color: 'var(--text-main)',
      maxWidth: '1400px',
      margin: '0 auto',
      borderRadius: '32px 32px 0 0',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      paddingBottom: isMobile ? 'calc(var(--app-bottom-nav-height, 70px) + 20px)' : '40px',
      overflow: 'hidden'
    }}>
      {/* Decorative Top Glow */}
      <div style={{
        position: 'absolute',
        top: 0, left: '20%', right: '20%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--accent-main), transparent)',
        opacity: 0.5,
        boxShadow: '0 0 20px var(--accent-main)'
      }} />

      <div style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr', 
          gap: isMobile ? '30px' : '40px',
          marginBottom: '80px'
        }}>
          {/* Brand Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <Link href="/" onClick={onLogoClick} style={{
              color: 'var(--text-main)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <img 
                src="/promptking-logo.svg"
                alt="PromptKing Logo" 
                width="180"
                height="55"
                style={{
                  height: isMobile ? '45px' : '55px',
                  width: 'auto',
                  objectFit: 'contain',
                  marginBottom: '4px'
                }}
              />
              <span style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                letterSpacing: '-1.5px',
                background: 'linear-gradient(to bottom, #14161a, rgba(20,22,26,0.7))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                PromptKing<span style={{ color: 'var(--accent-main)', WebkitTextFillColor: 'initial' }}>.</span>
              </span>
            </Link>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', maxWidth: '400px' }}>
              The premium library for AI engineering and creative workflows. Discover, unlock, and share world-class prompts for ChatGPT, Midjourney, and Gemini.
            </p>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
                  Expert tips sent straight to your inbox.
                </p>
                <div style={{
                  position: 'relative',
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: '50px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  padding: '4px',
                  display: 'flex',
                  transition: '0.3s',
                }} className="footer-input-wrapper">
                  <input
                    type="email"
                    placeholder="Enter email..."
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button style={{
                    padding: '0 18px',
                    background: 'var(--accent-main)',
                    border: 'none',
                    borderRadius: '50px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: '0.3s'
                  }} className="footer-submit-btn">
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{
          paddingTop: '30px',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', 
          justifyContent: isMobile ? 'center' : 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            &copy; {currentYear} PromptKing. All rights reserved.
          </p>


          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10a37f', boxShadow: '0 0 10px #10a37f' }} />
              All systems operational
            </div>
          )}
        </div>
      </div>

      <style>{`
        .footer-input-wrapper:focus-within {
          border-color: rgba(0,0,0,0.2) !important;
          background: rgba(0,0,0,0.02) !important;
        }
        .footer-submit-btn:hover {
          transform: scale(0.95);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        .social-link-icon:hover {
          background: var(--accent-main) !important;
          color: white !important;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(229,9,20,0.25);
        }
        .footer-link-text:hover {
          color: var(--text-main) !important;
          transform: translateX(3px);
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

