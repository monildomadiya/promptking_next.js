"use client";
import React, { useEffect, useRef, useState } from 'react';

const AdSenseUnit = ({ client, slot, format = 'auto', responsive = 'true', layoutKey = '', style = {}, className = '' }) => {
  const adRef = useRef(null);
  const pushed = useRef(false);
  const [status, setStatus] = useState('ready');

  useEffect(() => {
    pushed.current = false;
    setStatus('ready');
  }, [client, slot]);

  // Watch the <ins> and unmount if AdSense returns unfilled
  useEffect(() => {
    if (!adRef.current) return;
    const el = adRef.current;

    const checkStatus = () => {
      const adStatus = el.getAttribute('data-ad-status');
      if (adStatus === 'unfilled') {
        setStatus('unfilled');
      }
    };

    checkStatus();
    const observer = new MutationObserver(checkStatus);
    observer.observe(el, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });
    return () => observer.disconnect();
  }, [client, slot]);

  // Push the ad request once adsbygoogle.js is ready
  useEffect(() => {
    if (pushed.current || !client || !slot || !adRef.current) return;

    const tryPush = () => {
      if (pushed.current || !adRef.current) return;

      // Skip if this ins element already has an ad loaded inside it
      if (adRef.current.getAttribute('data-adsbygoogle-status') === 'done' ||
          adRef.current.innerHTML.trim() !== '') {
        pushed.current = true;
        return;
      }

      try {
        if (typeof window !== 'undefined') {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          pushed.current = true;
        }
      } catch (e) {
        if (!String(e).includes('already')) {
          console.error("AdSense error:", e);
        }
      }
    };

    // The adsbygoogle.js script is loaded via Next.js <Script> in layout.js.
    // We need to wait for it to be fully loaded before pushing.
    // Check if the script has already executed by seeing if adsbygoogle has
    // been converted from a plain array to the real AdSense object.
    const isScriptReady = () => {
      return typeof window !== 'undefined' &&
             window.adsbygoogle &&
             // Once adsbygoogle.js loads, it replaces the plain array with
             // its own object that has a .loaded property or is no longer a plain Array.
             (typeof window.adsbygoogle.loaded !== 'undefined' || !Array.isArray(window.adsbygoogle));
    };

    if (isScriptReady()) {
      // Script already loaded, push immediately
      tryPush();
    } else {
      // Script not loaded yet. Push into the queue — adsbygoogle.js will
      // process all queued pushes when it loads.
      tryPush();

      // Also set up a fallback: retry after a short delay in case the push
      // happened too early and got ignored.
      const retryTimer = setTimeout(() => {
        if (!pushed.current) {
          tryPush();
        }
      }, 1500);

      return () => clearTimeout(retryTimer);
    }
  }, [client, slot]);

  if (!client || !slot) return null;
  // Unfilled → remove entirely: no blank box, no reserved space, no layout shift.
  if (status === 'unfilled') return null;

  return (
    <div
      className={`adsense-container ${className}`}
      style={{
        margin: '20px 0',
        textAlign: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', background: 'transparent' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      />
    </div>
  );
};

export default AdSenseUnit;
