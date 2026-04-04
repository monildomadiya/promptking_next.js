import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, User, PlusCircle, LogIn } from 'lucide-react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';

const BottomNav = ({ user, profileData, onHomeClick }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("BottomNav: Login failed", error);
    }
  };

  return (
    <nav className="mobile-bottom-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 'var(--app-bottom-nav-height, 70px)',
      background: 'rgba(10, 10, 10, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-color)',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 2000,
      paddingBottom: 'env(safe-area-inset-bottom)',
      transition: 'transform 0.3s ease',
      display: 'flex'
    }}>
      <Link to="/" onClick={onHomeClick} style={navItemStyle(isActive('/'))} aria-label="Home">
        <Home size={24} />
        <span style={labelStyle}>Home</span>
      </Link>

      <Link to="/blog" style={navItemStyle(isActive('/blog'))} aria-label="Blog">
        <Compass size={24} />
        <span style={labelStyle}>Blog</span>
      </Link>

      {user ? (
        <div onClick={() => window.dispatchEvent(new CustomEvent('openProfile'))} style={navItemStyle(false)} aria-label="Profile" role="button">
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <img src={profileData?.avatar_url || user.photoURL} alt="User" width="24" height="24" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={labelStyle}>Profile</span>
        </div>
      ) : (
        <div onClick={handleLogin} style={navItemStyle(false)} aria-label="Sign In" role="button">
          <LogIn size={24} />
          <span style={labelStyle}>Sign In</span>
        </div>
      )}
    </nav>
  );
};

const navItemStyle = (active) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  textDecoration: 'none',
  color: active ? 'white' : 'var(--text-secondary)',
  transition: '0.3s',
  flex: 1
});

const labelStyle = {
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.5px'
};

export default BottomNav;
