"use client";
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, hsla(355, 92%, 47%, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(80px)'
      }} />

      {/* 404 Number */}
      <div style={{
        fontSize: 'clamp(6rem, 15vw, 12rem)',
        fontWeight: 900,
        lineHeight: 1,
        background: 'linear-gradient(180deg, rgba(20,22,26,0.14) 0%, rgba(20,22,26,0.04) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-8px',
        userSelect: 'none',
        position: 'relative',
        marginBottom: '-10px'
      }}>
        404
      </div>

      {/* Glass card */}
      <div style={{
        background: '#ffffff',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '24px',
        padding: '40px 48px',
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
        zIndex: 2,
        boxShadow: '0 16px 48px rgba(17, 24, 39, 0.12)'
      }}>
        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, hsla(355, 92%, 47%, 0.15), hsla(355, 92%, 47%, 0.05))',
          border: '1px solid hsla(355, 92%, 47%, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '24px'
        }}>
          🔍
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          Page Not Found
        </h2>

        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '32px'
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. 
          Let&apos;s get you back to exploring amazing AI prompts.
        </p>

        {/* CTA Button */}
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 32px',
          background: 'var(--accent-gradient)',
          color: 'white',
          borderRadius: '14px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '0.9rem',
          letterSpacing: '0.3px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px hsla(355, 92%, 47%, 0.3)',
          border: 'none'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Subtle bottom text */}
      <p style={{
        marginTop: '32px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        position: 'relative',
        zIndex: 2
      }}>
        PromptKing — 1000+ AI Prompts Library
      </p>
    </div>
  );
}
