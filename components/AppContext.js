"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { isPromptGridPath } from '@/lib/searchScope';

const AppContext = createContext();

// Kept only to paint the previous values instantly on load; freshness comes
// from the request that follows, never from the age of this copy.
const SETTINGS_CACHE_KEY = 'siteSettings';
const SETTINGS_CACHE_TS_KEY = 'siteSettings_ts';

export function AppProvider({ children }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({});
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(130);
  
  const pathname = usePathname();
  const isAdminPath = /^\/admin-secure(\/|$)/i.test(pathname || '');
  // Whether the prompt grid these two pieces of state filter is on screen.
  const canFilterPrompts = isPromptGridPath(pathname);

  // This provider outlives navigation, so a term typed on the home page would
  // otherwise still be filtering the grid on the way back from a prompt page —
  // with no visible search bar to explain why. Drop it on the way out instead.
  useEffect(() => {
    if (canFilterPrompts) return;
    setSearch('');
    setFilter('all');
  }, [canFilterPrompts]);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 1100);
    setHeaderHeight(window.innerWidth <= 1100 ? 85 : 130);
    
    const fetchAdminStatus = async () => {
      try {
        const response = await api.get('/admin/check_auth');
        setIsAdmin(response.data?.isAdmin || false);
      } catch (error) {}
    };

    const fetchSettings = async () => {
      // Paint from the last known settings so the header and ad slots don't
      // flash, then always ask the server anyway.
      //
      // This used to skip the request entirely whenever the cached copy was
      // under ten minutes old, which is the other half of why admin changes
      // "took some time": the server could have the new values instantly and a
      // returning visitor still wouldn't ask for them. The request is now
      // conditional (/api/settings sends an ETag), so the common case is a 304
      // with no body — cheaper than the timestamp check it replaces.
      try {
        const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
        if (cached) {
          setSettings(JSON.parse(cached));
          setIsSettingsLoaded(true);
        }
      } catch (error) {
        // Corrupt cache entry — fall through to the network.
      }

      try {
        const response = await api.get('/settings');
        if (response.data) {
          setSettings(response.data);
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(response.data));
          localStorage.setItem(SETTINGS_CACHE_TS_KEY, String(Date.now()));
        }
      } catch (error) {} finally {
        setIsSettingsLoaded(true);
      }
    };

    fetchSettings();
    fetchAdminStatus();

    // When admin saves settings, bust the cache and re-fetch immediately
    const handleSettingsUpdated = async () => {
      try {
        localStorage.removeItem(SETTINGS_CACHE_KEY);
        localStorage.removeItem(SETTINGS_CACHE_TS_KEY);
        // Bypass browser HTTP cache with a cache-busting param
        const response = await api.get(`/settings?_t=${Date.now()}`);
        if (response.data) {
          setSettings(response.data);
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(response.data));
          localStorage.setItem(SETTINGS_CACHE_TS_KEY, String(Date.now()));
        }
      } catch (error) {}
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1100);
      setHeaderHeight(window.innerWidth <= 1100 ? 85 : 130);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, []);

  return (
    <AppContext.Provider value={{
      search, setSearch,
      filter, setFilter,
      isAdmin, setIsAdmin,
      settings, setSettings, isSettingsLoaded,
      isMobile, headerHeight, setHeaderHeight,
      isAdminPath, canFilterPrompts
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
