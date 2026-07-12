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
      // NOTE: The adsbygoogle.js script is loaded globally via Next.js <Script>
      // tag in layout.js. Do NOT create a duplicate script here.
    }
  }, [settings?.adsense_enabled, settings?.adsense_client_id]);

  return null;
};

export default GoogleAdSense;
