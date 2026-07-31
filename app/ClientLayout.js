"use client";
import React from 'react';
import Script from 'next/script';
import { useAppContext } from '@/components/AppContext';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import GoogleAdSense from '@/components/Ads/GoogleAdSense';

import { optimizeImage } from '@/utils/imageUtils';

export default function ClientLayout({ children }) {
  const { search, setSearch, filter, setFilter, settings, isAdmin, setHeaderHeight, isAdminPath, headerHeight } = useAppContext();

  const resetHome = () => {
    setSearch('');
    setFilter('all');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resetPagination'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* The loader itself must be route-gated, not just <GoogleAdSense/>. Auto Ads
          injects from this script alone, so loading it globally put ads inside the
          admin dashboard — which is also an AdSense policy risk, since those pages
          have no publisher content. */}
      {!isAdminPath && (
        <Script
          id="adsbygoogle-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2762946314678354"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
      {!isAdminPath && <GoogleAdSense settings={settings} />}
      {!isAdminPath && (
        <Header 
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          onLogoClick={resetHome}
          settings={settings}
          isAdmin={isAdmin}
          onHeightChange={setHeaderHeight}
          optimizeImage={optimizeImage}
        />
      )}
      <div style={{ paddingTop: isAdminPath ? '0' : headerHeight + 'px', transition: 'padding-top 0.3s ease' }}>
        {children}
      </div>
      {!isAdminPath && <Footer onLogoClick={resetHome} />}
    </>
  );
}
