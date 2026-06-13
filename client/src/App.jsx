import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import api, { SERVER_URL } from './api';
import GoogleAdSense from './components/Ads/GoogleAdSense';
import { optimizeImage } from './utils/imageUtils';
import './index.css';

// Lazy load pages for better performance and handle chunk load errors after deployments
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });

const HomePage = lazyWithRetry(() => import('./pages/HomePage'));
const BlogPage = lazyWithRetry(() => import('./pages/BlogPage'));
const ArticlePage = lazyWithRetry(() => import('./pages/ArticlePage'));
const PromptDetailPage = lazyWithRetry(() => import('./pages/PromptDetailPage'));
const FAQPage = lazyWithRetry(() => import('./pages/FAQPage'));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const DisclaimerPage = lazyWithRetry(() => import('./pages/DisclaimerPage'));
const AdSensePolicyPage = lazyWithRetry(() => import('./pages/AdSensePolicyPage'));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage'));
const AdminDashboard = lazyWithRetry(() => import('./components/Admin/AdminDashboard'));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'));
const CategoryPage = lazyWithRetry(() => import('./pages/CategoryPage'));

// Loading Fallback Component
const PageLoader = () => (
  <div style={{ 
    minHeight: '100vh', 
    background: '#020202',
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '16px'
  }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      border: '3px solid rgba(255,255,255,0.08)', 
      borderTopColor: '#e50914', 
      borderRadius: '50%', 
      animation: 'spin 0.8s linear infinite' 
    }}></div>
  </div>
);


function AppContent() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState(() => {
    // Synchronously load cached settings to avoid header flash
    try {
      const cached = localStorage.getItem('siteSettings');
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1100);
  const [headerHeight, setHeaderHeight] = useState(isMobile ? 85 : 130);
  const location = useLocation();
  const navType = useNavigationType();
  const isAdminPath = /^\/admin-secure(\/|$)/i.test(location.pathname);

  const fetchAdminStatus = async () => {
    try {
      const response = await api.get('/admin/check_auth');
      setIsAdmin(response.data.isAdmin);
    } catch (error) {
      console.error("App: Failed to fetch admin status", error);
    }
  };

  const fetchSettings = async () => {
    try {
      // useState already loaded from cache synchronously — skip redundant setSettings
      // Just silently revalidate in background and update if data changed
      const response = await api.get('/settings');
      if (response.data) {
        setSettings(response.data);
        localStorage.setItem('siteSettings', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error("App: Failed to fetch settings", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdminStatus();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);

    // Re-fetch settings when admin saves branding
    const handleSettingsUpdated = () => fetchSettings();
    window.addEventListener('settingsUpdated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('resize', handleResize); // Fix: was missing — caused memory leak
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, []);

  // Scroll to top on page change, UNLESS we are navigating back (POP)
  useEffect(() => {
    if (navType !== 'POP') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname, navType]);

  const resetHome = () => {
    setSearch('');
    setFilter('all');
    window.dispatchEvent(new CustomEvent('resetPagination'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  return (
    <div className="App">
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
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage search={search} filter={filter} setFilter={setFilter} isMobile={isMobile} />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/admin-secure" element={<AdminDashboard />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/prompt/:key" element={<PromptDetailPage adsSettings={settings} />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/adsense-policy" element={<AdSensePolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </div>
      {!isAdminPath && <Footer onLogoClick={resetHome} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
