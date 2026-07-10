"use client";
import React, { useEffect, useRef } from 'react';

const AdSenseUnit = ({ client, slot, format = 'auto', responsive = 'true', style = {} }) => {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Don't push if already pushed for this instance or missing params
    if (pushed.current || !client || !slot) return;

    const tryPush = () => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch (e) {
        // Silently ignore "already has ad" errors — these are harmless
        if (!String(e).includes('already')) {
          console.error("AdSense error:", e);
        }
      }
    };

    // Check if the adsbygoogle script is already loaded
    const adsScript = document.querySelector('script[src*="adsbygoogle.js"]');
    if (adsScript) {
      // If the script element exists, wait for it to actually load
      if (adsScript.dataset.loaded === 'true') {
        tryPush();
      } else {
        adsScript.addEventListener('load', () => {
          adsScript.dataset.loaded = 'true';
          tryPush();
        });
        // In case it already loaded but we missed the event
        if (window.adsbygoogle) {
          tryPush();
        }
      }
    } else {
      // Script not yet in DOM — wait for it via MutationObserver
      const observer = new MutationObserver(() => {
        const script = document.querySelector('script[src*="adsbygoogle.js"]');
        if (script) {
          observer.disconnect();
          script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            tryPush();
          });
          // In case it already loaded
          if (window.adsbygoogle) {
            tryPush();
          }
        }
      });
      observer.observe(document.head, { childList: true });

      return () => observer.disconnect();
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <div className="adsense-container" style={{ margin: '20px 0', textAlign: 'center', ...style }}>
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
