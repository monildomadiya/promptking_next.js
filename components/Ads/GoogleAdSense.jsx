"use client";
import React, { useEffect } from 'react';

const GoogleAdSense = ({ settings }) => {
  useEffect(() => {
    if (settings.adsense_enabled === '1' && settings.adsense_client_id) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsense_client_id}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);

      return () => {
        const existingScript = document.querySelector(`script[src*="adsbygoogle.js"]`);
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [settings.adsense_enabled, settings.adsense_client_id]);

  return null;
};

export default GoogleAdSense;
