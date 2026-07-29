"use client";
import React, { useEffect } from 'react';
import { normalizeAdClient } from './normalizeAdClient';

const GoogleAdSense = ({ settings }) => {
  useEffect(() => {
    if (settings?.adsense_enabled === '1' && settings?.adsense_client_id) {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];

        // Normalize so a malformed DB value (missing "ca-" prefix / trailing
        // space) can't corrupt the account meta tag.
        const clientId = normalizeAdClient(settings.adsense_client_id);
        let metaTag = document.querySelector('meta[name="google-adsense-account"]');
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.name = 'google-adsense-account';
          metaTag.content = clientId;
          document.head.appendChild(metaTag);
        } else {
          metaTag.content = clientId;
        }
      }
      // NOTE: The adsbygoogle.js script is loaded globally via Next.js <Script>
      // tag in layout.js. Do NOT create a duplicate script here.
    }
  }, [settings?.adsense_enabled, settings?.adsense_client_id]);

  return null;
};

export default GoogleAdSense;
