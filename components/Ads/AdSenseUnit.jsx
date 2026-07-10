"use client";
import React, { useEffect, useRef, useState } from 'react';

const AdSenseUnit = ({ client, slot, format = 'auto', responsive = 'true', style = {}, className = '' }) => {
  const adRef = useRef(null);
  const pushed = useRef(false);
  const [isUnfilled, setIsUnfilled] = useState(false);

  useEffect(() => {
    pushed.current = false;
    setIsUnfilled(false);
  }, [client, slot]);

  useEffect(() => {
    if (!adRef.current) return;
    const checkStatus = () => {
      const status = adRef.current?.getAttribute('data-adsbygoogle-status');
      const adStatus = adRef.current?.getAttribute('data-ad-status');
      if (status === 'unfilled' || adStatus === 'unfilled') {
        setIsUnfilled(true);
      }
    };
    checkStatus();
    const observer = new MutationObserver(checkStatus);
    observer.observe(adRef.current, { attributes: true, attributeFilter: ['data-adsbygoogle-status', 'data-ad-status'] });
    return () => observer.disconnect();
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
    <div 
      className={`adsense-container ${className}`} 
      style={{ 
        margin: '20px 0', 
        textAlign: 'center', 
        overflow: 'hidden', 
        display: isUnfilled ? 'none' : 'block',
        ...style 
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: isUnfilled ? 'none' : 'block', background: 'transparent' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

export default AdSenseUnit;

