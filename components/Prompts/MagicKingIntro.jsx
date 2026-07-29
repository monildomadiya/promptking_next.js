"use client";
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Crown } from '../Common/Icons';
import KingImage from '../../assets/prompt-king.webp';

const MagicKingIntro = ({ isMobile }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="magic-king-section"
      style={{
        marginTop: '60px',
        marginBottom: '60px',
        position: 'relative',
        borderRadius: '36px',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.06), inset 0 2px 10px rgba(255, 255, 255, 0.9)',
        overflow: 'hidden',
        padding: isMobile ? '40px 24px' : '64px 72px',
      }}
    >
      <style>{`
        @keyframes rotateKingAura {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes floatMagicParticle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* Sleek Top Red Accent Beam */}
      <div style={{
        position: 'absolute',
        top: 0, left: '15%', right: '15%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(229, 9, 20, 0.6), transparent 100%)',
        zIndex: 0
      }} />

      {/* Subtle Watermark Crown in Background */}
      <div style={{
        position: 'absolute',
        right: '4%',
        top: '10%',
        fontSize: isMobile ? '140px' : '220px',
        opacity: 0.025,
        color: '#e50914',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
        lineHeight: 1
      }}>
        👑
      </div>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: isMobile ? '44px' : '72px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Side: Museum Pedestal Stage */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            flex: '0 0 auto',
            width: isMobile ? '280px' : '370px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* Subtle Rotating Aura Behind Statue */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '15px' : '25px',
            width: isMobile ? '230px' : '310px',
            height: isMobile ? '230px' : '310px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(229, 9, 20, 0.1) 0%, transparent 70%)',
            filter: 'blur(25px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Pedestal Stage Glass Card */}
          <div style={{
            width: '100%',
            height: isMobile ? '280px' : '370px',
            borderRadius: '32px',
            background: 'radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.07), inset 0 2px 12px rgba(255, 255, 255, 1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'visible',
            padding: '20px',
            zIndex: 1
          }}>
            {/* Elegant Floating Crown Icon */}
            <div
              style={{
                position: 'absolute',
                top: '24px',
                right: '26px',
                background: '#ffffff',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffb703',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
                zIndex: 2,
                animation: 'floatMagicParticle 4s ease-in-out infinite'
              }}
            >
              <Crown size={18} fill="#f59e0b" />
            </div>

            {/* Elegant Floating Sparkle Icon */}
            <div
              style={{
                position: 'absolute',
                bottom: '48px',
                left: '26px',
                background: '#ffffff',
                border: '1px solid rgba(229, 9, 20, 0.2)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e50914',
                boxShadow: '0 4px 14px rgba(229, 9, 20, 0.08)',
                zIndex: 2,
                animation: 'floatMagicParticle 5s ease-in-out infinite 1s'
              }}
            >
              <Sparkles size={17} />
            </div>

            {/* King Statue */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
                cursor: 'pointer'
              }}
              title="PromptKing Realm"
            >
              <Image 
                src={KingImage} 
                alt="Prompt King"
                style={{
                  maxHeight: '112%',
                  maxWidth: '112%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 18px 30px rgba(15,23,42,0.18)) drop-shadow(0 0 16px rgba(229, 9, 20, 0.12))',
                  marginTop: '-14px'
                }}
              />
            </motion.div>
          </div>

          {/* Clean Status Shimmer Badge */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            style={{
              marginTop: '-18px',
              zIndex: 3,
              background: '#ffffff',
              border: '1px solid rgba(229, 9, 20, 0.22)',
              padding: '6px 18px',
              borderRadius: '100px',
              boxShadow: '0 8px 20px rgba(229, 9, 20, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '0.3px'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#e50914',
              boxShadow: '0 0 8px rgba(229, 9, 20, 0.6)',
              display: 'inline-block'
            }} />
            AI ALCHEMY ENGINE • <span style={{ color: '#e50914' }}>ACTIVE v3.0</span>
          </motion.div>
        </motion.div>

        {/* Right Side: Editorial Proclamation */}
        <div style={{ 
          flex: 1, 
          textAlign: isMobile ? 'center' : 'left'
        }}>
          {/* Top Pill Badge */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(229, 9, 20, 0.08)',
            border: '1px solid rgba(229, 9, 20, 0.22)',
            padding: '6px 16px',
            borderRadius: '100px',
            color: '#e50914',
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1.4px',
            marginBottom: '18px'
          }}>
            <Sparkles size={14} />
            THE MAGIC RULER OF PROMPTS
          </div>
          
          {/* Main Title (Removed "Welcome to my realm.") */}
          <h2 style={{
            fontSize: isMobile ? '2.4rem' : '3.3rem',
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: '22px',
            lineHeight: 1.1,
            letterSpacing: '-1.4px'
          }}>
            I am <span style={{
              background: 'linear-gradient(135deg, #e50914 0%, #b80710 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>PromptKing</span>.
          </h2>
          
          {/* Editorial Story Text */}
          <div style={{
            fontSize: isMobile ? '0.98rem' : '1.1rem',
            color: '#475569',
            lineHeight: 1.75,
            marginBottom: '28px'
          }}>
            <p style={{ marginBottom: '14px' }}>
              I am no ordinary ruler; I am the <strong style={{ color: '#0f172a', fontWeight: '800' }}>Magic King of digital creation</strong>. 
              I wield ancient and boundless power to breathe life into the mundane, 
              transforming any ordinary concept into an extraordinary masterpiece of pure visual alchemy.
            </p>
            <p style={{ margin: 0 }}>
              With a mere whisper of intent—a single, perfect prompt—I can reshape reality, 
              bending pixels, lighting, and colors to my will. Step into my domain and experience the power of supreme AI craftsmanship.
            </p>
          </div>

          {/* Clean Proclamation Callout Card */}
          <motion.div
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
            style={{
              background: '#ffffff',
              border: '1px solid rgba(229, 9, 20, 0.18)',
              borderRadius: '20px',
              padding: isMobile ? '18px 20px' : '22px 26px',
              boxShadow: '0 8px 25px rgba(229, 9, 20, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}
          >
            <div style={{
              background: 'rgba(229, 9, 20, 0.08)',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#e50914'
            }}>
              <Sparkles size={19} />
            </div>
            <div>
              <p style={{
                fontSize: isMobile ? '0.9rem' : '0.96rem',
                color: '#1e293b',
                fontWeight: '600',
                fontStyle: 'italic',
                lineHeight: 1.6,
                margin: '0 0 8px'
              }}>
                “Every prompt curated here holds the power of true creative alchemy. No ordinary commands—only master-crafted spells engineered for ChatGPT, Gemini, and Midjourney.”
              </p>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                color: '#e50914',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                — Royal Proclamation v3.0
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MagicKingIntro;
