"use client";
import React, { useEffect, useRef } from 'react';

const AdSenseUnit = ({ client, slot, format = 'auto', responsive = 'true', style = {}, className = '' }) => {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    pushed.current = false;
  }, [client, slot]);

  useEffect(() => {
    if (pushed.current || !client || !slot || !adRef.current) return;

    const tryPush = () => {
      if (pushed.current || !adRef.current) return;

      // Check if this ins element already has an ad loaded inside it
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

  return (
    <div className={`adsense-container ${className}`} style={{ margin: '20px 0', textAlign: 'center', overflow: 'hidden', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

export default AdSenseUnit;

