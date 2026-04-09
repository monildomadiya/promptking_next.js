import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Eye, Lock, Unlock, Youtube, ArrowRight, Crown, Code, Instagram, Layout, Zap, Sparkles, Image, MessageSquare, Laptop, ChevronLeft, ChevronRight } from '../Common/Icons';
import api, { SERVER_URL } from '../../api';
import confetti from 'canvas-confetti';
import YouTubeModal from '../Modals/YouTubeModal';

const PromptCard = ({ prompt, isUnlocked, onUnlock, onLock, isHighlighted, searchTerm }) => {
  const [sliderValue, setSliderValue] = useState(50);
  const [pin, setPin] = useState('');
  const [showError, setShowError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSnapping, setIsSnapping] = useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardPadding = isMobile ? 10 : 18;

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
    if (isUnlocked && prompt.isPremium) {
      setTimeout(() => {
        const box = document.getElementById(`box-${prompt.key}`);
        if (box) {
          box.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 400); // Wait for open/unlock animation
    }
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
      // Auto-center current card for UX
      setTimeout(() => {
        const box = document.getElementById(`box-${prompt.key}`);
        if (box) {
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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



  const handleCopy = async () => {
    try {
      const brandedText = `${prompt.promptText}\n\n- Copied from PromptKing.in`;
      await navigator.clipboard.writeText(brandedText);
      await api.post('/record_copy', { key: prompt.key });
      setIsCopied(true);
      
      // Feedback Animation: Success pulse and Confetti
      if (prompt.isPremium) {
        setIsSnapping(true);
        triggerSnapConfetti();
        // Clear PIN instantly for security
        setPin(''); 
      } else {
        // Enhanced Celebration for Free Content
        const box = document.getElementById(`box-${prompt.key}`);
        if (box) {
          const rect = box.getBoundingClientRect();
          const x = (rect.left + rect.width / 2) / window.innerWidth;
          const y = (rect.top + rect.height / 2) / window.innerHeight;
          
          const count = 60;
          const defaults = { 
            origin: { x, y }, 
            colors: ['#e50914', '#FFD700', '#ffffff'],
            zIndex: 9999,
            scalar: 0.8
          };

          confetti({ ...defaults, particleCount: count, spread: 30, startVelocity: 45 });
          confetti({ ...defaults, particleCount: 40, spread: 60, startVelocity: 25 });
        }
      }
      
      // Hard Relock (Snappy 100ms for Premium, 2000ms for Free to allow Copied! feedback)
      setTimeout(() => {
        setIsSnapping(false);
        setIsCopied(false);
        if (prompt.isPremium) {
          onLock(); // Tell parent to relock
        }
      }, prompt.isPremium ? 100 : 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const safeAiType = (prompt.aiType || '').toLowerCase();
  
  // Dynamic Icon selection based on AI Type
  const getAiIcon = () => {
    if (safeAiType.includes('chatgpt')) return <Zap size={16} fill="#10a37f" color="#10a37f" />;
    if (safeAiType.includes('gemini')) return <Sparkles size={16} color="#4285f4" />;
    if (safeAiType.includes('midjourney') || safeAiType.includes('dall-e')) return <Image size={16} color="#FF00FF" />;
    if (safeAiType.includes('coding') || safeAiType.includes('coder')) return <Code size={16} color="#00FF00" />;
    return <Layout size={16} />;
  };

  const badgeClass = safeAiType.includes('chatgpt') ? 'chatgpt' : 
                   safeAiType.includes('gemini') ? 'gemini' : 
                   safeAiType.includes('midjourney') ? 'midjourney' : '';

  const optimizeImage = (url, width = 600) => {
    if (!url) return url;
    
    // If the image is locally uploaded, it might already have SERVER_URL prepended by api.js
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
          position: 'absolute', top: '-16px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 110
        }}>
          <div style={{
            background: 'var(--accent-main)',
            border: '3px solid #0a0a0f',
            color: 'white', padding: '4px 16px', borderRadius: '50px', fontSize: '0.75rem',
            fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            animation: 'bounce 2s infinite',
            whiteSpace: 'nowrap'
          }}>
            ✦ Search Match: {prompt.prompt_key}
          </div>
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
            <img src={optimizeImage(prompt.imgAfter)} alt="After" loading="lazy" width="400" height="225" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <img 
              src={optimizeImage(prompt.imgBefore)} 
              alt="Before" 
              loading="lazy"
              width="400"
              height="225"
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
                <ChevronLeft size={24} color="black" style={{ display: 'block', margin: '-4px 0' }} />
                <ChevronRight size={24} color="black" style={{ display: 'block', margin: '-4px 0' }} />
              </div>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={sliderValue} 
              onChange={handleSliderChange}
              aria-label="Image comparison slider"
              style={{ position: 'absolute', inset: 0, zIndex: 10, opacity: 0, cursor: 'ew-resize', width: '100%', height: '100%' }}
            />
            

          </div>
        ) : (prompt.imgAfter || prompt.imgBefore) && (
          <div style={{ width: `calc(100% + ${cardPadding * 2}px)`, margin: `-${cardPadding}px -${cardPadding}px 15px -${cardPadding}px`, aspectRatio: ratio, background: '#111', borderRadius: '20px 20px 0 0', overflow: 'hidden', minHeight: isMobile ? '140px' : '180px', position: 'relative' }}>
            <img src={optimizeImage(prompt.imgAfter || prompt.imgBefore)} alt={prompt.title} loading="lazy" width="400" height="225" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            

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
            minHeight: isUnlocked ? (prompt.isPremium ? (isMobile ? '300px' : '380px') : (isMobile ? '170px' : '180px')) : '140px',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isUnlocked ? (isCopied && !prompt.isPremium ? (isMobile ? 'scale(1.02)' : 'scale(1.03)') : 'scale(1.01)') : 'scale(1)'
          }}>
            {/* macOS Style Header */}
            <div style={{ 
              background: 'transparent', 
              padding: isMobile ? '8px 10px' : '12px 15px', 
              borderBottom: '1px solid rgba(255,255,255,0.04)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '12px' 
            }}>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F56' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFBD2E' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27C93F' }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, minWidth: 0 }}>
                <span className={`badge ${badgeClass}`} style={{ 
                  fontSize: isMobile ? '10px' : '11px', 
                  padding: isMobile ? '2px 8px' : '3px 10px',
                  borderRadius: '6px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${brandColor || 'rgba(255,255,255,0.2)'}`,
                  color: brandColor || 'white',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap'
                }}>{prompt.aiType || 'AI'}</span>
              </div>
            </div>
            
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="unlocked-prompt-content" style={{ 
                position: 'absolute', inset: 0, padding: isMobile ? '15px 15px 45px 15px' : '24px 24px 60px 24px', 
                fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace', 
                fontSize: isMobile ? '0.82rem' : '0.9rem', color: '#a1a1aa', lineHeight: isMobile ? 1.6 : 1.8,
                filter: (isUnlocked) ? 'none' : 'blur(10px)', 
                WebkitFilter: (isUnlocked) ? 'none' : 'blur(10px)',
                userSelect: (isUnlocked) ? 'text' : 'none', 
                overflowY: (isUnlocked) ? 'auto' : 'hidden'
              }}>
                <HighlightText text={prompt.promptText} highlight={searchTerm} />
              </div>

              {isUnlocked && (
                <button 
                  onClick={handleCopy}
                  aria-label="Copy prompt text"
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
                    transition: 'all 0.3s ease',
                    animation: isCopied ? 'copyButtonPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
                  }}
                  className="pro-card-hover"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? 'Copied!' : 'Copy'}

                  {/* Floating Toast Indicator */}
                  {isCopied && (
                    <span style={{
                      position: 'absolute',
                      top: '-35px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--accent-main)',
                      color: 'white',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)',
                      animation: 'toastFloatUp 0.6s ease-out forwards',
                      zIndex: 100
                    }}>
                      Success!
                    </span>
                  )}
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
                          width: isMobile ? '110px' : '140px',
                          height: isMobile ? '36px' : '42px',
                          borderRadius: '100px',
                          border: showError ? '2px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.08)',
                          color: 'white', 
                          textAlign: 'center', 
                          outline: 'none', 
                          letterSpacing: isMobile ? '4px' : '8px', 
                          fontSize: '16px', 
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                          padding: 0
                        }} 
                      />
                    </form>
                  </div>

                  {showError && <p style={{ color: '#ff4444', fontSize: '0.75rem', marginTop: '8px', fontWeight: 600 }}>Incorrect PIN</p>}
                  
                  {prompt.igLink && (
                    <button 
                      onClick={() => setShowVideoModal(true)}
                      aria-label="Get PIN from video"
                      style={{ 
                        background: 'transparent', 
                        fontSize: isMobile ? '0.7rem' : '0.85rem', color: 'rgba(255,255,255,0.6)', 
                        display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px', 
                        flexDirection: isMobile ? 'column' : 'row',
                        textDecoration: 'none', border: 'none', cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center'
                      }}
                      onMouseOver={(e) => { if (!isMobile) e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { if (!isMobile) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
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
            
            {/* Premium Icon */}
            {prompt.isPremium && (
              <div style={{
                position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%',
                width: '38px', height: '38px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                <Crown size={18} fill="#FFD700" color="#FFD700" />
              </div>
            )}
          </div>
          
          <YouTubeModal 
            isOpen={showVideoModal} 
            onClose={() => setShowVideoModal(false)} 
            videoUrl={prompt.igLink} 
          />
        </div>



      <style>{`
        .chatgpt { color: #10a37f; background: rgba(16, 163, 127, 0.05) !important; border-color: rgba(16, 163, 127, 0.3) !important; }
        .gemini { color: #4285f4; background: rgba(66, 133, 244, 0.05) !important; border-color: rgba(66, 133, 244, 0.3) !important; }
        .midjourney { color: #a855f7; background: rgba(168, 85, 247, 0.05) !important; border-color: rgba(168, 85, 247, 0.3) !important; }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }



        @keyframes copyPulse {
          0% { transform: scale(1.01); border-color: var(--accent-main); }
          50% { transform: scale(1.04); border-color: #27C93F; box-shadow: 0 0 50px rgba(39, 201, 63, 0.4); }
          100% { transform: scale(1.01); border-color: #27C93F; box-shadow: 0 0 20px rgba(39, 201, 63, 0.2); }
        }

        .copy-success-pulse {
          animation: copyPulse 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes copyButtonPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes toastFloatUp {
          0% { opacity: 0; transform: translate(-50%, 10px); }
          20% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }

        @media (hover: hover) and (pointer: fine) {
          .pro-card-hover:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 35px rgba(229, 9, 20, 0.15) !important;
            border-color: rgba(229, 9, 20, 0.4) !important;
          }
          
          .youtube-btn-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(229, 9, 20, 0.15) !important;
            border-color: rgba(229, 9, 20, 0.3) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PromptCard;
