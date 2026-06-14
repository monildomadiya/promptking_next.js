"use client";
import React from 'react';
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
