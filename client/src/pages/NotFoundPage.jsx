import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '../components/Common/Icons';
import SEOMetadata from '../components/SEO/SEOMetadata';

const NotFoundPage = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-color)', 
      color: 'white',
      padding: '20px',
      textAlign: 'center'
    }}>
      {/* noIndex is crucial here to prevent Soft 404 indexing errors in Google */}
      <SEOMetadata 
        title="404 Not Found | PromptKing" 
        description="The page you are looking for does not exist." 
        noIndex={true} 
      />

      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)',
        padding: '60px',
        borderRadius: '40px',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        maxWidth: '600px',
        width: '100%'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          background: 'var(--accent-main)',
          filter: 'blur(100px)',
          opacity: 0.2,
          zIndex: 0,
          borderRadius: '50%'
        }}></div>

        <h1 style={{ 
          fontSize: '6rem', 
          fontWeight: 900, 
          margin: 0, 
          background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.3))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          zIndex: 1
        }}>
          404
        </h1>
        
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '10px', marginBottom: '20px', zIndex: 1 }}>
          Page Not Found
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '40px', zIndex: 1 }}>
          Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: 'var(--accent-main)', 
            color: 'white', 
            padding: '16px 32px', 
            borderRadius: '100px', 
            fontWeight: 800, 
            textDecoration: 'none',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 30px rgba(229, 9, 20, 0.3)',
            zIndex: 1
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(229, 9, 20, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(229, 9, 20, 0.3)';
          }}
        >
          <ArrowLeft size={20} /> Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
