"use client";
import React, { useEffect, useState } from 'react';
import AdSenseUnit from './AdSenseUnit';
import { X } from '@/components/Common/Icons';

/**
 * Sticky bottom "anchor" ad — the single highest-viewability manual placement,
 * which is what drives RPM up on mobile-heavy traffic. It is fully policy-safe:
 *   • clearly labelled "Advertisement"
 *   • dismissible with a visible close button (remembered for the session)
 *   • only shown AFTER cookie consent, so it never overlaps the consent banner
 *   • collapses completely if the slot is unfilled (no empty bar)
 *   • reserves matching bottom padding so it never hides page content
 *
 * Inert until an admin sets `adsense_slot_anchor`, so it changes nothing on the
 * live site until you create the ad unit in AdSense and paste its slot ID.
 */
export default function AnchorAd({ settings }) {
  const enabled = settings?.adsense_enabled === '1' && !!settings?.adsense_slot_anchor;

  const [hidden, setHidden] = useState(true); // start hidden to avoid SSR/first-paint flash
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const dismissed = sessionStorage.getItem('pk_anchor_dismissed') === '1';
    // Only surface once the user has interacted with the cookie banner, so the
    // anchor bar and the consent dialog never fight for the bottom of the screen.
    const hasConsent = !!localStorage.getItem('pk_cookie_consent');
    setHidden(dismissed || !hasConsent);
  }, [enabled]);

  const show = enabled && !hidden && !unfilled;

  // Push page content up by the bar height while it is visible.
  useEffect(() => {
    document.body.style.paddingBottom = show ? '96px' : '';
    return () => { document.body.style.paddingBottom = ''; };
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9000,
        background: 'rgba(10,10,12,0.97)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.45)',
        padding: '4px 10px 8px',
      }}
    >
      <div style={{ maxWidth: '970px', margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '18px' }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Advertisement
          </span>
          <button
            onClick={() => { setHidden(true); try { sessionStorage.setItem('pk_anchor_dismissed', '1'); } catch (e) {} }}
            aria-label="Close ad"
            style={{
              width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
        <AdSenseUnit
          client={settings.adsense_client_id}
          slot={settings.adsense_slot_anchor}
          format="auto"
          style={{ margin: 0 }}
          onUnfilled={() => setUnfilled(true)}
        />
      </div>
    </div>
  );
}
