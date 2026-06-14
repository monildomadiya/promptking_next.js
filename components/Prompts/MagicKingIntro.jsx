"use client";
import React from 'react';
import { Sparkles, Crown, Zap } from '../Common/Icons';
import KingImage from '../../assets/prompt-king.webp';

const MagicKingIntro = ({ isMobile }) => {
  return (
    <div className="magic-king-section" style={{
      marginTop: '80px',
      marginBottom: '40px',
      position: 'relative',
      borderRadius: '32px',
      background: 'rgba(15, 15, 15, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
      overflow: 'visible'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        padding: isMobile ? '40px 24px' : '30px 60px',
        gap: isMobile ? '30px' : '50px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Side: The King's Original Image */}
        <div style={{
          flex: '0 0 auto',
          width: isMobile ? '220px' : '380px',
          height: isMobile ? '220px' : '380px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <img 
            src={KingImage} 
            alt="Prompt King" 
            style={{
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5)) drop-shadow(0 0 15px rgba(229, 9, 20, 0.2))',
            }}
          />
        </div>

        {/* Right Side: The Proclamation */}
        <div style={{ 
          flex: 1, 
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '10px', 
            color: 'var(--accent-main)',
            fontSize: '0.85rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '8px'
          }}>
            <Sparkles size={14} />
            The Magic Ruler
            <Zap size={14} />
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '1.8rem' : '2.4rem',
            fontWeight: 900,
            color: 'white',
            marginBottom: '10px',
            lineHeight: 1.2,
          }}>
            I am <span style={{ color: 'var(--accent-main)' }}>PromptKing</span>. Welcome to my realm.
          </h2>
          
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            color: 'var(--text-dim)',
            lineHeight: 1.6,
          }}>
            <p style={{ marginBottom: '10px' }}>
              I am no ordinary ruler; I am the <strong>Magic King of digital creation</strong>. 
              I wield the ancient and boundless power to breathe life into the mundane, 
              transforming any ordinary image into a masterpiece of pure magic.
            </p>
            <p>
              With a mere whisper of intent—a single, perfect prompt—I can reshape reality, 
              bending pixels and colors to my will. Step into my domain, 
              witness the power of true visual alchemy, and let us create magic together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicKingIntro;
