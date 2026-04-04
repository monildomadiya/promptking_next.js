import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Copy, Check, Eye, Lock, Unlock, Youtube, ArrowRight, Crown, Code, Instagram } from 'lucide-react';
import api from '../../api';
import confetti from 'canvas-confetti';
import YouTubeModal from '../Modals/YouTubeModal';

const PromptCard = ({ prompt, user, isLiked, onLikeToggle, isUnlocked, onUnlock, onLock, isHighlighted, searchTerm }) => {
  const [sliderValue, setSliderValue] = useState(50);
  const [pin, setPin] = useState('');
  const [showError, setShowError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSnapping, setIsSnapping] = useState(false);
  const [showAuthHint, setShowAuthHint] = useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardPadding = isMobile ? 12 : 18;

  const cardRef = React.useRef(null);

  const HighlightText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) return <span>{text}</span>;
    const parts = String(text).split(new RegExp(`(${highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
            <mark key={i}>{part}</mark> : part
        )}
      </span>
    );
  };

  React.useEffect(() => {
    // Scroll into view removed to eliminate scroll animation effects
  }, [isUnlocked]);

  const ratio = (prompt.image_ratio || prompt.imageRatio || '16/9').toString().replace(/\s+/g, '').trim();
  const aiType = prompt.aiType || '';
  const brandColor = aiType.toLowerCase().includes('chatgpt') ? '#10a37f' :
                    aiType.toLowerCase().includes('gemini') ? '#4285f4' :
                    aiType.toLowerCase().includes('midjourney') ? '#a855f7' : 
                    'rgba(255,255,255,0.4)';

  const handleSliderChange = (e) => {
    setSliderValue(e.target.value);
  };

  const checkAutoUnlock = (value) => {
    setPin(value);
    setShowError(false);
    const targetPass = String(prompt.password || '1234').trim();
    const inputPass = String(value || '').trim();
    
    // console.log(`Checking: "${inputPass}" vs "${targetPass}"`); 
    
    if (inputPass === targetPass) {
      onUnlock();
      api.post('/record_unlock', { key: prompt.key }).catch(console.error);
      triggerConfetti();
    } else if (inputPass.length >= targetPass.length) {
      setShowError(true);
      setTimeout(() => {
        setPin('');
        setShowError(false);
      }, 800);
    }
  };

  const triggerConfetti = () => {
    const box = document.getElementById(`box-${prompt.key}`);
    if (box) {
      const rect = box.getBoundingClientRect();
      const originX = (rect.left + (rect.width / 2)) / window.innerWidth;
      const originY = (rect.top + (rect.height / 2)) / window.innerHeight;
      setTimeout(() => {
        const freshRect = box.getBoundingClientRect();
        const originX = (freshRect.left + (freshRect.width / 2)) / window.innerWidth;
        const originY = (freshRect.top + (freshRect.height / 2)) / window.innerHeight;

        const count = 200;
        const defaults = {
          origin: { x: originX, y: originY },
          colors: ['#e50914', '#FFD700'],
          zIndex: 9999
        };

        function fire(particleRatio, opts) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      }, 50);
    }
  };

  const triggerHeartConfetti = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 15,
      shapes: ['heart'],
      colors: ['#e50914', '#ff4d4d', '#ff8080', '#ffffff'],
      zIndex: 9999
    };

    confetti({
      ...defaults,
      particleCount: 20,
      origin: { x, y }
    });
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    
    if (!user) {
      setShowAuthHint(true);
      setTimeout(() => setShowAuthHint(false), 3000);
      window.dispatchEvent(new CustomEvent('openLogin', { 
        detail: { message: 'Login required to save your likes' } 
      }));
      return;
    }
    
    // Trigger pop animation immediately
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 450);

    // Call original toggle
    onLikeToggle(prompt.key);

    // Trigger heart confetti if we are LIKING (not unliking)
    if (!isLiked) {
      triggerHeartConfetti(e);
    }
  };

  const handleLikeWithEffect = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      setShowAuthHint(true);
      setTimeout(() => setShowAuthHint(false), 3000);
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    
    // Call heart confetti
    triggerHeartConfetti(e);
    
    // Call original toggle
    onLikeToggle(prompt.key);
  };

  const triggerSnapConfetti = () => {
    const box = document.getElementById(`box-${prompt.key}`);
    if (box) {
      const rect = box.getBoundingClientRect();
      const originX = (rect.left + (rect.width / 2)) / window.innerWidth;
      const originY = (rect.top + (rect.height / 2)) / window.innerHeight;
      
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { x: originX, y: originY },
        colors: ['#4a4a4a', '#2c2c2c', '#6a6a6a', '#1a1a1a'],
        gravity: 0.1,
        scalar: 0.7,
        drift: 1,
        ticks: 200,
        zIndex: 9999
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      await api.post('/record_copy', { key: prompt.key });
      setIsCopied(true);
      
      // Feedback Animation: Success pulse and Confetti
      if (prompt.isPremium) {
        // Start Thanos Snap only for Premium content
        setIsSnapping(true);
        triggerSnapConfetti();
      } else {
        // Success Confetti for Free content
        const box = document.getElementById(`box-${prompt.key}`);
        if (box) {
          const rect = box.getBoundingClientRect();
          const x = (rect.left + rect.width / 2) / window.innerWidth;
          const y = (rect.top + rect.height / 2) / window.innerHeight;
          
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { x, y },
            colors: ['#e50914', '#FFD700', '#ffffff'],
            scale: 0.8,
            zIndex: 9999
          });
        }
      }
      
      // Wait for animation or reset time
      setTimeout(() => {
        setIsSnapping(false);
        setIsCopied(false);
        if (prompt.isPremium) {
          onLock();
          setPin(''); // Reset PIN for next time
        }
      }, 800);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const AuthHint = () => (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      right: '0',
      marginBottom: '10px',
      background: 'rgba(229, 9, 20, 0.95)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '6px 14px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 800,
      whiteSpace: 'nowrap',
      zIndex: 100,
      boxShadow: '0 10px 30px rgba(229, 9, 20, 0.4)',
      animation: 'fadeUp 0.3s ease-out forwards',
      pointerEvents: 'none'
    }}>
      Login to Save Likes
      <div style={{
        position: 'absolute',
        top: '100%',
        right: '12px',
        width: '0',
        height: '0',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid rgba(229, 9, 20, 0.95)'
      }}></div>
    </div>
  );

  const safeAiType = (prompt.aiType || '').toLowerCase();
  const badgeClass = safeAiType.includes('chatgpt') ? 'chatgpt' : 
                   safeAiType.includes('gemini') ? 'gemini' : 
                   safeAiType.includes('midjourney') ? 'midjourney' : '';

  return (
    <div ref={cardRef} className="pro-card pro-card-hover masonry-grid-item glass-card" style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      border: isHighlighted ? '2px solid var(--accent-main)' : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      padding: `${cardPadding}px`,
      zIndex: isHighlighted ? 10 : 1,
      transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
      transition: 'all 0.4s ease-in-out',
      boxShadow: isHighlighted ? '0 0 25px rgba(229, 9, 20, 0.3)' : 'none',
      position: 'relative',
      overflow: isHighlighted ? 'visible' : 'hidden' // Only allow overflow for highlighted sticker
    }}>
      {isHighlighted && (
        <div style={{
          position: 'absolute', top: '-15px', right: '20px', background: 'var(--accent-main)',
          color: 'white', padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem',
          fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          zIndex: 110, animation: 'bounce 2s infinite'
        }}>
          <HighlightText text="Search Match" highlight={searchTerm} />: <HighlightText text={prompt.prompt_key} highlight={searchTerm} />
        </div>
      )}
      {/* Top Content Wrapper - Animate disappearance */}
      <div style={{
        maxHeight: (isUnlocked && prompt.isPremium) ? '0' : '600px',
        opacity: (isUnlocked && prompt.isPremium) ? '0' : '1',
        overflow: 'hidden',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: (isUnlocked && prompt.isPremium) ? 'none' : 'auto',
        marginBottom: (isUnlocked && prompt.isPremium) ? '0' : '8px'
      }}>
        {/* Image Section */}
        {prompt.isImageSlider ? (
          <div className="slider-container" style={{ 
            aspectRatio: ratio, width: `calc(100% + ${cardPadding * 2}px)`, margin: `-${cardPadding}px -${cardPadding}px 15px -${cardPadding}px`,
            position: 'relative', overflow: 'hidden', borderRadius: '20px 20px 0 0', borderBottom: '1px solid var(--border-color)',
            minHeight: isMobile ? '140px' : '180px', background: '#111'
          }}>
            <img src={prompt.imgAfter} alt="After" loading="lazy" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <img 
              src={prompt.imgBefore} 
              alt="Before" 
              loading="lazy"
              style={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                WebkitClipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                zIndex: 2
              }} 
            />
            <div style={{ 
              position: 'absolute', top: 0, bottom: 0, left: `${sliderValue}%`, width: '2px', 
              background: 'white', zIndex: 3, transform: 'translateX(-50%)', pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  color: 'black', 
                  borderRadius: '20px', 
                  width: '24px', 
                  height: '40px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '-8px',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)', 
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  flexShrink: 0
                }}
              >
                <i className="fa fa-caret-left" aria-hidden="true" style={{ fontSize: '24px', display: 'block', lineHeight: 0.7, margin: 0 }}></i>
                <i className="fa fa-caret-right" aria-hidden="true" style={{ fontSize: '24px', display: 'block', lineHeight: 0.7, margin: 0 }}></i>
              </div>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={sliderValue} 
              onChange={handleSliderChange}
              style={{ position: 'absolute', inset: 0, zIndex: 10, opacity: 0, cursor: 'ew-resize', width: '100%', height: '100%' }}
            />
            
            {/* Floating Like Button for Slider */}
            <button 
              onClick={handleLikeWithEffect}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 30,
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                padding: 0
              }}
              className="pro-card-hover"
            >
              {showAuthHint && <AuthHint />}
              <Heart 
                size={18} 
                fill={isLiked ? '#e50914' : 'none'} 
                color={isLiked ? '#e50914' : 'white'} 
                style={{ transition: '0.3s' }}
              />
            </button>
            {/* Premium Icon Near Like (Slider) */}
            {prompt.isPremium && (
              <div style={{
                position: 'absolute', top: '20px', right: '65px', background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%',
                width: '38px', height: '38px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                <Crown size={18} fill="#FFD700" color="#FFD700" />
              </div>
            )}
          </div>
        ) : (prompt.imgAfter || prompt.imgBefore) && (
          <div style={{ width: `calc(100% + ${cardPadding * 2}px)`, margin: `-${cardPadding}px -${cardPadding}px 15px -${cardPadding}px`, aspectRatio: ratio, background: '#111', borderRadius: '20px 20px 0 0', overflow: 'hidden', minHeight: isMobile ? '140px' : '180px', position: 'relative' }}>
            <img src={prompt.imgAfter || prompt.imgBefore} alt={prompt.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Floating Like Button for Static Image */}
            <button 
              onClick={handleLikeWithEffect}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 30,
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                padding: 0
              }}
              className="pro-card-hover"
            >
              {showAuthHint && <AuthHint />}
              <Heart 
                size={18} 
                fill={isLiked ? '#e50914' : 'none'} 
                color={isLiked ? '#e50914' : 'white'} 
                style={{ transition: '0.3s' }}
              />
            </button>
            {/* Premium Icon Near Like (Static) */}
            {prompt.isPremium && (
              <div style={{
                position: 'absolute', top: '20px', right: '65px', background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%',
                width: '38px', height: '38px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                <Crown size={18} fill="#FFD700" color="#FFD700" />
              </div>
            )}
          </div>
        )}
        {/* Header Info */}
        <Link to={`/prompt/${prompt.slug || prompt.prompt_key || prompt.key}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: 500, 
            marginBottom: '8px', 
            lineHeight: 1.4,
            color: 'rgba(255, 255, 255, 0.9)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            <HighlightText text={prompt.title} highlight={searchTerm} />
          </h3>
        </Link>
      </div>

      {/* Prompt Area */}
      {!prompt.hidePromptBox && (
        <div style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <div id={`box-${prompt.key}`} className={`prompt-area ${isUnlocked ? 'unlocked' : ''} ${isSnapping ? 'thanos-snap' : ''} ${isCopied && !prompt.isPremium ? 'copy-success-pulse' : ''}`} style={{
            background: 'rgba(15, 15, 20, 0.4)', 
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px', 
            position: 'relative', 
            overflow: 'hidden',
            display: 'flex', 
            flexDirection: 'column', 
            margin: (isUnlocked && prompt.isPremium) ? '0' : '0 0 15px 0', 
            border: isUnlocked ? (prompt.isPremium ? '1px solid #FFD700' : (isCopied ? '1px solid #27C93F' : '1px solid var(--accent-main)')) : '1px solid rgba(255,255,255,0.06)',
            boxShadow: isUnlocked ? (prompt.isPremium ? (isMobile ? '0 0 20px rgba(255, 215, 0, 0.1)' : '0 0 40px rgba(255, 215, 0, 0.15)') : (isCopied ? '0 0 30px rgba(39, 201, 63, 0.3)' : (isMobile ? '0 0 15px rgba(229, 9, 20, 0.15)' : '0 0 40px rgba(229, 9, 20, 0.2)'))) : 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 30px rgba(0,0,0,0.5)',
            minHeight: isUnlocked ? (isMobile ? '300px' : '380px') : '140px',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isUnlocked ? (isCopied && !prompt.isPremium ? (isMobile ? 'scale(1.02)' : 'scale(1.03)') : 'scale(1.01)') : 'scale(1)'
          }}>
            {/* macOS Style Header */}
            <div style={{ background: 'transparent', padding: isMobile ? '8px 10px' : '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F56' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFBD2E' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27C93F' }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className={`badge ${badgeClass}`} style={{ 
                  fontSize: '0.65rem', 
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${brandColor || 'rgba(255,255,255,0.2)'}`,
                  color: brandColor || 'white',
                  letterSpacing: '0.5px'
                }}>{prompt.aiType || 'AI'}</span>
              </div>
            </div>
            
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="unlocked-prompt-content" style={{ 
                position: 'absolute', inset: 0, padding: '24px 24px 60px 24px', 
                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace', 
                fontSize: '0.9rem', color: '#a1a1aa', lineHeight: 1.8,
                filter: (isUnlocked) ? 'none' : 'blur(10px)', 
                WebkitFilter: (isUnlocked) ? 'none' : 'blur(10px)',
                userSelect: (isUnlocked) ? 'text' : 'none', 
                overflowY: (isUnlocked) ? 'auto' : 'hidden'
              }}>
                {prompt.promptText}
              </div>

              {isUnlocked && (
                <button 
                  onClick={handleCopy}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: isCopied ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '8px 15px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    zIndex: 20,
                    transition: 'all 0.3s ease'
                  }}
                  className="pro-card-hover"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              )}

              {!isUnlocked && (
                <div style={{ 
                  position: 'absolute', inset: 0, background: 'rgba(10, 10, 12, 0.85)', 
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 12px', zIndex: 10, gap: '10px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%'
                  }}>
                    <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <input 
                        type="password" 
                        placeholder="••••" 
                        value={pin}
                        onChange={(e) => checkAutoUnlock(e.target.value)}
                        style={{ 
                          width: '140px',
                          height: '42px',
                          borderRadius: '100px',
                          border: showError ? '2px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.08)',
                          color: 'white', 
                          textAlign: 'center', 
                          outline: 'none', 
                          letterSpacing: '8px', 
                          fontSize: '1rem', 
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }} 
                      />
                    </form>
                  </div>

                  {showError && <p style={{ color: '#ff4444', fontSize: '0.75rem', marginTop: '8px', fontWeight: 600 }}>Incorrect PIN</p>}
                  
                  {prompt.igLink && (
                    <button 
                      onClick={() => setShowVideoModal(true)}
                      style={{ 
                        background: 'transparent', 
                        fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px', 
                        textDecoration: 'none', border: 'none', cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                    >
                      {prompt.igLink.includes('instagram') ? (
                        <Instagram size={16} color="currentColor" />
                      ) : (
                        <Youtube size={16} color="currentColor" />
                      )}
                      Get PIN from {prompt.igLink.includes('instagram') ? 'Reel' : 'Short'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <YouTubeModal 
            isOpen={showVideoModal} 
            onClose={() => setShowVideoModal(false)} 
            videoUrl={prompt.igLink} 
          />
        </div>
      )}




      <style>{`
        .chatgpt { color: #10a37f; background: rgba(16, 163, 127, 0.05) !important; border-color: rgba(16, 163, 127, 0.3) !important; }
        .gemini { color: #4285f4; background: rgba(66, 133, 244, 0.05) !important; border-color: rgba(66, 133, 244, 0.3) !important; }
        .midjourney { color: #a855f7; background: rgba(168, 85, 247, 0.05) !important; border-color: rgba(168, 85, 247, 0.3) !important; }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes heartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }

        .heart-pop {
          animation: heartPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes thanosSnap {
          0% { opacity: 1; filter: blur(0px) brightness(1); transform: scale(1.02); }
          100% { opacity: 0; filter: blur(10px) brightness(1.5); transform: scale(1.1); }
        }

        .thanos-snap {
          animation: thanosSnap 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
          pointer-events: none;
        }

        @keyframes copyPulse {
          0% { transform: scale(1.01); border-color: var(--accent-main); }
          50% { transform: scale(1.03); border-color: #27C93F; box-shadow: 0 0 50px rgba(39, 201, 63, 0.4); }
          100% { transform: scale(1.01); border-color: #27C93F; }
        }

        .copy-success-pulse {
          animation: copyPulse 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .youtube-btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(229, 9, 20, 0.15) !important;
          border-color: rgba(229, 9, 20, 0.3) !important;
        }
      `}</style>
    </div>
  );
};

export default PromptCard;
