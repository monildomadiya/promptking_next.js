import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import api, { SERVER_URL } from './api';
import GoogleAdSense from './components/Ads/GoogleAdSense';
import './index.css';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const PromptDetailPage = lazy(() => import('./pages/PromptDetailPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const AdSensePolicyPage = lazy(() => import('./pages/AdSensePolicyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));

// Loading Fallback Component
const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  </div>
);


function AppContent() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [headerHeight, setHeaderHeight] = useState(isMobile ? 85 : 130);
  const location = useLocation();
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
      const cached = localStorage.getItem('siteSettings');
      if (cached) {
        try { setSettings(JSON.parse(cached)); } catch(e) {}
      }
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
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, []);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const resetHome = () => {
    setSearch('');
    setFilter('all');
    window.dispatchEvent(new CustomEvent('resetPagination'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const optimizeImage = (url, width = 600) => {
    if (!url) return url;
    let rawUrl = url;
    if (url.startsWith(SERVER_URL)) {
      rawUrl = url.replace(SERVER_URL, '');
    }
    if (rawUrl.startsWith('/uploads/') || rawUrl.includes('images.unsplash.com') || rawUrl.includes('i.pinimg.com')) {
      return `${SERVER_URL}/api/optimize?src=${encodeURIComponent(rawUrl)}&w=${width}`;
    }
    return url;
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
