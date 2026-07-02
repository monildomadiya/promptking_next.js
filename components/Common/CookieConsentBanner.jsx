"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_KEY = 'pk_cookie_consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,   // always on
    analytics: true,
    advertising: true,
  });

  useEffect(() => {
    // Show banner if no consent stored
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      // Small delay so it doesn't flash on first load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (consentData) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({
      ...consentData,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }));
    setVisible(false);
  };

  const acceptAll = () => {
    saveConsent({ essential: true, analytics: true, advertising: true });
  };

  const rejectNonEssential = () => {
    saveConsent({ essential: true, analytics: false, advertising: false });
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: showDetails ? 'block' : 'none',
      }} onClick={() => setShowDetails(false)} />

      {/* Main Banner */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie consent"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(680px, calc(100vw - 32px))',
          zIndex: 9999,
          background: 'rgba(15, 15, 20, 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'slideUpCookie 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <style>{`
          @keyframes slideUpCookie {
            from { opacity: 0; transform: translateX(-50%) translateY(30px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
            background: 'rgba(229, 9, 20, 0.1)', border: '1px solid rgba(229, 9, 20, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
          }}>
            🍪
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
              We value your privacy
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              We use cookies to enhance your experience, serve personalized ads via{' '}
              <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Google AdSense</strong>, and analyze traffic.
              By clicking "Accept All", you consent to our use of cookies.{' '}
              <Link href="/privacy" style={{ color: 'var(--accent-main)', textDecoration: 'none', fontWeight: 600 }}>
                Privacy Policy
              </Link>
              {' · '}
              <Link href="/terms" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                Terms
              </Link>
            </p>
          </div>
        </div>

        {/* Expanded Preferences */}
        {showDetails && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '20px', marginBottom: '20px',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            {[
              {
                key: 'essential', label: 'Essential Cookies', locked: true,
                desc: 'Required for the website to function. Cannot be disabled.'
              },
              {
                key: 'analytics', label: 'Analytics Cookies',
                desc: 'Help us understand how visitors use our site (Google Analytics).'
              },
              {
                key: 'advertising', label: 'Advertising Cookies',
                desc: 'Used to show personalized ads based on your interests (Google AdSense).'
              },
            ].map(({ key, label, locked, desc }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{desc}</div>
                </div>
                <button
                  onClick={() => !locked && setPreferences(p => ({ ...p, [key]: !p[key] }))}
                  aria-checked={locked ? true : preferences[key]}
                  role="switch"
                  aria-label={label}
                  style={{
                    flexShrink: 0, width: '48px', height: '26px', borderRadius: '13px',
                    border: 'none', cursor: locked ? 'default' : 'pointer',
                    position: 'relative', transition: 'background 0.25s',
                    background: (locked || preferences[key]) ? 'var(--accent-main)' : 'rgba(255,255,255,0.15)',
                    opacity: locked ? 0.7 : 1,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '3px',
                    left: (locked || preferences[key]) ? '25px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'white', transition: 'left 0.25s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={acceptAll}
            id="cookie-accept-all"
            style={{
              flex: '1 1 160px', padding: '13px 24px',
              background: 'var(--accent-main)', color: 'white',
              border: 'none', borderRadius: '50px', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 800, transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(229, 9, 20, 0.35)',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            Accept All
          </button>

          {showDetails ? (
            <button
              onClick={savePreferences}
              id="cookie-save-preferences"
              style={secondaryBtnStyle}
            >
              Save Preferences
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              id="cookie-manage-preferences"
              style={secondaryBtnStyle}
            >
              Manage Preferences
            </button>
          )}

          <button
            onClick={rejectNonEssential}
            id="cookie-reject-optional"
            style={{
              padding: '13px 20px', background: 'transparent', color: 'rgba(255,255,255,0.35)',
              border: 'none', borderRadius: '50px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
          >
            Reject Optional
          </button>
        </div>
      </div>
    </>
  );
}

const secondaryBtnStyle = {
  flex: '1 1 140px', padding: '13px 24px',
  background: 'rgba(255,255,255,0.06)', color: 'white',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px',
  cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.2s',
};
