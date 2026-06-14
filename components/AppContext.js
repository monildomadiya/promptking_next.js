"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({});
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
        const cached = localStorage.getItem('siteSettings');
        if (cached) setSettings(JSON.parse(cached));
        const response = await api.get('/settings');
        if (response.data) {
          setSettings(response.data);
          localStorage.setItem('siteSettings', JSON.stringify(response.data));
        }
      } catch (error) {}
    };

    fetchSettings();
    fetchAdminStatus();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AppContext.Provider value={{
      search, setSearch,
      filter, setFilter,
      isAdmin, setIsAdmin,
      settings, setSettings,
      isMobile, headerHeight, setHeaderHeight,
      isAdminPath
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
