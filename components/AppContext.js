"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

const AppContext = createContext();

const SETTINGS_CACHE_KEY = 'siteSettings';
const SETTINGS_CACHE_TS_KEY = 'siteSettings_ts';
const SETTINGS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
      try {
        // Check if we have a fresh cached version (within TTL)
        const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
        const cachedTs = localStorage.getItem(SETTINGS_CACHE_TS_KEY);
        
        if (cached && cachedTs) {
          const age = Date.now() - parseInt(cachedTs, 10);
          if (age < SETTINGS_CACHE_TTL) {
            // Cache is fresh — use it and skip the API call entirely
            setSettings(JSON.parse(cached));
            setIsSettingsLoaded(true);
            return;
          }
        }
        
        // Cache is stale or missing — show stale data immediately while fetching fresh
        if (cached) setSettings(JSON.parse(cached));
        
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
      isAdminPath
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
