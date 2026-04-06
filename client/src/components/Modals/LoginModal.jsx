import React from 'react';
import KingDialog from './KingDialog';
import { X, Mail, Lock, User, Shield } from '../Common/Icons';
import { motion } from 'framer-motion';

const LoginModal = ({ isOpen, onClose, onLogin, message }) => {
  return (
    <KingDialog
      isOpen={isOpen}
      onClose={onClose}
      title={message ? "Authentication Required" : "Welcome Back"}
      maxWidth="420px"
    >
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '20px', 
          background: 'rgba(229, 9, 20, 0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--accent-main)',
          border: '1px solid rgba(229, 9, 20, 0.2)'
        }}>
          <Shield size={32} />
        </div>
        
        <p style={{ 
          color: 'white', 
          fontSize: '1.1rem', 
          fontWeight: 600, 
          marginBottom: '10px' 
        }}>
          {message || "Sign in to explore more features"}
        </p>
        
        <p style={{ 
          color: 'var(--text-dim)', 
          fontSize: '0.9rem', 
          marginBottom: '30px',
          lineHeight: 1.5
        }}>
          Join our community to save your favorite prompts, unlock premium strategies, and more.
        </p>

        <motion.button
          whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z" fill="#4285f4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.183l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.331C2.438 15.983 5.482 18 9 18z" fill="#34a853"/>
            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.957H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.043l3.007-2.331z" fill="#fbbc05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958l3.007 2.331C4.672 5.164 6.656 3.58 9 3.58z" fill="#ea4335"/>
          </svg>
          Sign in with Google
        </motion.button>
        
        <p style={{ 
          marginTop: '20px', 
          fontSize: '0.8rem', 
          color: 'var(--text-dim)' 
        }}>
          By signing in, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </KingDialog>
  );
};

export default LoginModal;
