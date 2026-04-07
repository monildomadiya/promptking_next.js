import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import BottomNav from './components/Layout/BottomNav';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import api from './api';
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
  <div style={{ 
    minHeight: '60vh', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '20px'
  }}>
    <div className="loader"></div>
    <p style={{ color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '1px' }}>LOADING EXPERIENCE...</p>
  </div>
);


function AppContent() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', email: '', avatar_url: '' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [headerHeight, setHeaderHeight] = useState(isMobile ? 85 : 130);
  const location = useLocation();
  const isAdminPath = /^\/admin(\/|$)/i.test(location.pathname);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/get_profile');
      if (response.data) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error("App: Failed to fetch profile", error);
    }
  };

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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        api.defaults.headers.common['X-User-Id'] = firebaseUser.uid;
        try {
          await api.post('/login', {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            picture: firebaseUser.photoURL
          });
          setUser(firebaseUser);
          fetchProfile();
          fetchAdminStatus();
        } catch (error) {
          console.error("App: Backend login failed", error);
        }
      } else {
        delete api.defaults.headers.common['X-User-Id'];
        setUser(null);
        setProfileData({ name: '', email: '', avatar_url: '' });
        fetchAdminStatus();
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, []);

  const resetHome = () => {
    setSearch('');
    setFilter('all');
    if (window.location.pathname !== '/') {
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="App">
      {settings?.favicon_url && (
        <Helmet>
          <link rel="icon" type="image/png" href={settings.favicon_url} />
          <link rel="apple-touch-icon" href={settings.favicon_url} />
        </Helmet>
      )}
      {!isAdminPath && <GoogleAdSense settings={settings} />}
      {!isAdminPath && (
        <Header 
          user={user} 
          profileData={profileData} 
          onProfileUpdate={fetchProfile} 
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          onLogoClick={resetHome}
          settings={settings}
          isAdmin={isAdmin}
          onHeightChange={setHeaderHeight}
        />
      )}
      <div style={{ paddingTop: isAdminPath ? '0' : headerHeight + 'px', transition: 'padding-top 0.3s ease' }}>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage user={user} search={search} filter={filter} setFilter={setFilter} isMobile={isMobile} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/prompt/:key" element={<PromptDetailPage user={user} adsSettings={settings} />} />
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
      {!isAdminPath && <BottomNav user={user} profileData={profileData} onHomeClick={resetHome} />}
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
