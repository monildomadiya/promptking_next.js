"use client";
import React, { useEffect } from 'react';

const GoogleAdSense = ({ settings }) => {
  useEffect(() => {
    if (settings?.adsense_enabled === '1' && settings?.adsense_client_id) {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];

        let metaTag = document.querySelector('meta[name="google-adsense-account"]');
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.name = 'google-adsense-account';
          metaTag.content = settings.adsense_client_id;
          document.head.appendChild(metaTag);
        } else {
          metaTag.content = settings.adsense_client_id;
        }
      }

      // Check if the script already exists before adding a new one
      const existingScript = document.querySelector(`script[src*="adsbygoogle.js"]`);
      if (existingScript) return;

      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsense_client_id}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        script.dataset.loaded = "true";
      };
      document.head.appendChild(script);
    }
  }, [settings?.adsense_enabled, settings?.adsense_client_id]);

  return null;
};

export default GoogleAdSense;

