"use client";
import React, { useEffect, useRef, useState } from 'react';

const AdSenseUnit = ({ client, slot, format = 'auto', responsive = 'true', layoutKey = '', style = {}, className = '' }) => {
  const adRef = useRef(null);
  const pushed = useRef(false);
  // 'loading' → invisible (no space, no flash) | 'filled' → fade in | 'unfilled' → unmounted
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    pushed.current = false;
    setStatus('loading');
  }, [client, slot]);

  // Watch the <ins> and only reveal it once a real ad is filled.
  useEffect(() => {
    if (!adRef.current) return;
    const el = adRef.current;

    const checkStatus = () => {
      const adStatus = el.getAttribute('data-ad-status');

      if (adStatus === 'unfilled') {
        setStatus('unfilled');
      } else if (adStatus === 'filled') {
        setStatus('filled');
      } else {
        const iframe = el.querySelector('iframe');
        if (iframe && el.getAttribute('data-ad-status') !== 'unfilled') {
          setTimeout(() => {
            if (el && el.getAttribute('data-ad-status') !== 'unfilled') {
              setStatus('filled');
            }
          }, 200);
        }
      }
    };

    checkStatus();
    const observer = new MutationObserver(checkStatus);
    observer.observe(el, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [client, slot]);

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

    const adsScript = document.querySelector('script[src*="adsbygoogle.js"]');
    if (adsScript) {
      if (adsScript.dataset.loaded === 'true') {
        tryPush();
      } else {
        const onLoad = () => {
          adsScript.dataset.loaded = 'true';
          tryPush();
        };
        adsScript.addEventListener('load', onLoad);
        tryPush();
        return () => adsScript.removeEventListener('load', onLoad);
      }
    } else {
      // Push immediately into queue; when adsbygoogle.js loads it processes all queued items
      tryPush();
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
        transition: 'opacity 0.25s ease',
        ...style,
        // While loading, occupy ZERO space (opacity alone still reserves
        // layout height — that was the invisible empty gap). Width stays
        // measurable so AdSense can still size and request the ad.
        ...(status === 'filled'
          ? { opacity: 1 }
          : { opacity: 0 }),
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
