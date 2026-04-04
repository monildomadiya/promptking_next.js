import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import api from '../../api';
import { Search, LogOut, Settings, User, Mail, Shield, Zap, Star, Layout, Menu, X, Filter, Heart, Crown, LogIn, ChevronDown, Camera, Activity } from 'lucide-react';
import LoginModal from '../Modals/LoginModal';
import AdSenseUnit from '../Ads/AdSenseUnit';

const Header = ({ user, profileData, onProfileUpdate, search, setSearch, filter, setFilter, showFilters, setShowFilters, onLogoClick, settings, isAdmin }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [localName, setLocalName] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // fetchSettings removed - now provided via props from App.jsx

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsLoginOpen(false);
    } catch (error) {
      console.error("Google Sign-In failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await api.get('/logout');
      setShowProfileModal(false);
      navigate('/');
    } catch (error) {
      console.error("Sign-Out failed", error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData();
    formData.append('name', localName);
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput && avatarInput.files[0]) {
      formData.append('avatar', avatarInput.files[0]);
    }

    try {
      const response = await api.post('/update_profile', formData);
      if (response.data.status === 'success') {
        onProfileUpdate();
        setIsSaving(false);
        setTimeout(() => setShowProfileModal(false), 1000);
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Control header visibility based on scroll direction
      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY && !isSearchExpanded) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      
      setIsScrolled(currentScrollY > 20);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Fetch categories
    api.get('/categories').then(res => setCategories(res.data));

    const handleOpenProfile = () => setShowProfileModal(true);
    window.addEventListener('openProfile', handleOpenProfile);
    
    const handleTriggerLogin = (e) => {
      if (e.detail && e.detail.message) {
        setLoginMessage(e.detail.message);
      } else {
        setLoginMessage('');
      }
      setIsLoginOpen(true);
    };
    window.addEventListener('openLogin', handleTriggerLogin);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('openProfile', handleOpenProfile);
      window.removeEventListener('openLogin', handleTriggerLogin);
    };
  }, [lastScrollY]);

  useEffect(() => {
    if (profileData) {
      if (profileData.avatar_url) setAvatarPreview(profileData.avatar_url);
      if (profileData.name) setLocalName(profileData.name);
    }
  }, [profileData]);

  return (
    <>
      <header style={{
        position: 'fixed',
        top: isMobile ? '10px' : '20px',
        left: 0,
        right: 0,
        margin: '0 auto',
        width: isMobile ? 'calc(100% - 20px)' : 'calc(100% - 40px)',
        maxWidth: '1400px',
        zIndex: 2000,
        background: 'rgba(10, 10, 15, 0.7)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: isMobile ? '10px 15px' : '12px 20px',
        boxShadow: isScrolled ? '0 20px 40px rgba(0, 0, 0, 0.4)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-120%)',
        opacity: isVisible ? 1 : 0,
        minHeight: isMobile ? '65px' : '82px'
      }}>
        <div style={{ 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'relative',
          gap: isMobile ? '10px' : '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <Link 
              to="/" 
              onClick={onLogoClick}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                height: isMobile ? '45px' : 'auto' // Match search height for stability
              }}
            >
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  style={{ 
                    width: isMobile ? `${settings.logo_width_mobile || 120}px` : `${settings.logo_width_desktop || 180}px`,
                    height: 'auto', 
                    objectFit: 'contain',
                    transition: '0.3s'
                  }} 
                  className="site-logo"
                />
              ) : (
                <h1 className="header-logo-text" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>PromptKing</h1>
              )}
            </Link>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '10px' : '20px',
            flex: isMobile && isSearchExpanded ? 1 : 'initial',
            justifyContent: 'flex-end',
            minWidth: 0
          }}>
            {/* Search Bar - Desktop (Right) or Expandable (Mobile) */}
            <div style={{ 
              flex: isMobile && isSearchExpanded ? 1 : 'initial',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              transition: 'all 0.3s ease',
              gap: '10px',
              minWidth: 0
            }}>
              {isMobile && !isSearchExpanded ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
                    className="pro-card-hover"
                    title="Premium Prompts"
                    style={{ 
                      width: '38px', height: '38px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: filter === 'premium' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: filter === 'premium' ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                      color: filter === 'premium' ? '#FFC107' : 'rgba(255,255,255,0.7)',
                      transition: '0.3s',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Crown size={18} fill={filter === 'premium' ? '#FFC107' : 'none'} />
                  </button>
                  {user && (
                    <button 
                      onClick={() => setFilter(filter === 'liked' ? 'all' : 'liked')}
                      className="pro-card-hover"
                      title="My Likes"
                      style={{ 
                        width: '38px', height: '38px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: filter === 'liked' ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: filter === 'liked' ? '1px solid rgba(229, 9, 20, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                        color: filter === 'liked' ? '#E50914' : 'rgba(255,255,255,0.7)',
                        transition: '0.3s',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <Heart size={18} fill={filter === 'liked' ? '#E50914' : 'none'} />
                    </button>
                  )}
                  <div 
                    className="glass-button-secondary"
                    onClick={() => setIsSearchExpanded(true)}
                    style={{ 
                      width: '38px', height: '38px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <Search size={18} />
                  </div>
                </div>
              ) : (
                <div style={{ 
                  width: isMobile && isSearchExpanded ? '100%' : (isMobile ? '0' : '350px'), 
                  position: 'relative', 
                  display: 'flex', 
                  alignItems: 'center',
                  flex: isMobile && isSearchExpanded ? 1 : 'initial'
                }}>
                  <Search 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '16px', 
                      color: 'var(--text-secondary)',
                      opacity: 0.6
                    }} 
                  />
                  <input 
                    type="text" 
                    autoFocus={isMobile && isSearchExpanded}
                    placeholder={isMobile ? "Search prompts..." : "Search prompts..."}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (window.location.pathname !== '/') {
                        navigate('/');
                      }
                    }}
                    onBlur={() => {
                      if (isMobile && search.trim() === '') {
                        setIsSearchExpanded(false);
                      }
                    }}
                    className="glass-input"
                    style={{ 
                      width: '100%', 
                      padding: isMobile ? '10px 15px 10px 45px' : '12px 15px 12px 45px', 
                      borderRadius: '50px',
                      fontSize: isMobile ? '16px' : '0.9rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      height: isMobile ? '45px' : '48px'
                    }} 
                  />
                  {isMobile && isSearchExpanded && (
                    <X 
                      size={20} 
                      style={{ position: 'absolute', right: '15px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      onClick={() => {
                        setSearch('');
                        setIsSearchExpanded(false);
                      }}
                    />
                  )}
                </div>
              )}
              
            </div>
            
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Status Icons - Only show on home page where filtering is active */}
                {window.location.pathname === '/' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
                      className="pro-card-hover"
                      title="Premium Prompts"
                    style={{ 
                      width: '42px', height: '42px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: filter === 'premium' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: filter === 'premium' ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                      color: filter === 'premium' ? '#FFC107' : 'rgba(255,255,255,0.7)',
                      transition: '0.3s',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Crown size={20} fill={filter === 'premium' ? '#FFC107' : 'none'} />
                  </button>
                  {user && (
                    <button 
                      onClick={() => setFilter(filter === 'liked' ? 'all' : 'liked')}
                      className="pro-card-hover"
                      title="My Likes"
                      style={{ 
                        width: '42px', height: '42px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: filter === 'liked' ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: filter === 'liked' ? '1px solid rgba(229, 9, 20, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                        color: filter === 'liked' ? '#E50914' : 'rgba(255,255,255,0.7)',
                        transition: '0.3s',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <Heart size={20} fill={filter === 'liked' ? '#E50914' : 'none'} />
                    </button>
                  )}
                </div>
              )}

                {/* Admin Link */}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    title="Admin Panel"
                    className="pro-card-hover"
                    style={{ 
                      width: '42px', height: '42px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3B82F6',
                      transition: '0.3s',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Shield size={20} fill="rgba(59, 130, 246, 0.2)" />
                  </Link>
                )}

                {/* User Actions */}
                <nav style={{ display: 'flex', alignItems: 'center' }}>
                  {user ? (
                    <div 
                      className="user-profile-pill pro-card-hover"
                      onClick={() => setShowProfileModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '5px 18px 5px 5px',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: '2px solid transparent' }}>
                        <img src={avatarPreview || user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="profile-name-text" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Welcome back,</span>
                        <span className="profile-name-text" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                          {profileData.name || user.displayName} <ChevronDown size={14} style={{ marginLeft: '6px', color: 'var(--accent-main)' }} />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsLoginOpen(true)}
                      style={{
                        background: 'var(--accent-main)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 28px',
                        borderRadius: '50px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 8px 20px rgba(229, 9, 20, 0.2)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 25px rgba(229, 9, 20, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(229, 9, 20, 0.2)';
                      }}
                    >
                      Sign In
                    </button>
                  )}
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {showProfileModal && (
        <div className="glass-overlay" style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="glass-modal" style={{
            padding: isMobile ? '35px 25px' : '45px', 
            width: isMobile ? 'calc(100% - 30px)' : '100%', 
            maxWidth: '480px', 
            textAlign: 'center', 
            position: 'relative',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: isMobile ? '32px' : '28px'
          }}>
            <X 
              size={22} 
              style={{ position: 'absolute', top: '25px', right: '25px', color: 'var(--text-secondary)', cursor: 'pointer', transition: '0.3s' }} 
              onClick={() => setShowProfileModal(false)}
              className="hover-rotate"
            />
            <h2 style={{ 
              marginBottom: isMobile ? '25px' : '35px', 
              fontSize: isMobile ? '1.6rem' : '2rem', 
              fontWeight: 900, 
              fontFamily: '"Outfit", sans-serif',
              background: 'linear-gradient(to bottom, #fff, #aaa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>User Profile</h2>
            
            <form onSubmit={handleUpdateProfile}>
              <div 
                style={{
                  position: 'relative', 
                  width: isMobile ? '100px' : '130px', 
                  height: isMobile ? '100px' : '130px', 
                  margin: '0 auto 30px auto',
                  borderRadius: '50%', padding: '4px', background: 'var(--accent-gradient)',
                  boxShadow: '0 0 30px rgba(229, 9, 20, 0.3)', cursor: 'pointer', transition: '0.4s'
                }}
                className="profile-avatar-wrap"
                onClick={() => document.getElementById('avatarInput').click()}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '4px solid #111', background: '#111' }}>
                  <img src={avatarPreview || user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', opacity: 0, transition: '0.3s',
                  backdropFilter: 'blur(4px)'
                }} className="avatar-overlay">
                  <Camera size={26} />
                </div>
                <input type="file" id="avatarInput" style={{ display: 'none' }} accept="image/*" onChange={(e) => {
                  if (e.target.files[0]) {
                    setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }} />
              </div>

              <div className="glass-divider" />

              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Display Name</label>
                <input 
                  type="text" 
                  value={localName} 
                  onChange={(e) => setLocalName(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', padding: '14px 18px', borderRadius: '12px' }}
                  required 
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: isMobile ? '15px' : '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email} 
                  disabled 
                  className="glass-input"
                  style={{ width: '100%', padding: isMobile ? '12px 15px' : '14px 18px', borderRadius: '12px', opacity: 0.5, cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginTop: isMobile ? '25px' : '40px' }}>
                <button 
                  type="button" 
                  onClick={handleLogout}
                  className="glass-button-secondary"
                  style={{ 
                    flex: 1, 
                    padding: isMobile ? '14px' : '16px', 
                    borderRadius: '16px', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                  }}
                >
                  Logout
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  style={{ 
                    flex: 2, 
                    background: 'var(--accent-gradient)', 
                    color: 'white', 
                    border: 'none', 
                    padding: isMobile ? '14px' : '16px', 
                    borderRadius: '16px', 
                    fontWeight: 800, 
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    boxShadow: '0 10px 25px rgba(229, 9, 20, 0.3)',
                    transition: '0.3s',
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? 'Updating...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLogin={handleLogin}
        message={loginMessage}
      />
      {/* Top Banner Ad - Policy Compliant Placement */}
      {settings?.adsense_enabled === '1' && settings?.adsense_slot_header && (
        <div style={{ 
          position: 'fixed', 
          top: isMobile ? '85px' : '130px', 
          left: 0, 
          right: 0, 
          zIndex: 900,
          background: 'rgba(0,0,0,0.2)',
          padding: '10px 0',
          backdropFilter: 'blur(10px)'
        }}>
          <AdSenseUnit client={settings.adsense_client_id} slot={settings.adsense_slot_header} />
        </div>
      )}
    </>
  );
};

export default Header;
