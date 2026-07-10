"use client";
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Copy, Check, Eye, Lock, Unlock, Youtube, ArrowRight, Crown, Code, Instagram, Layout, Zap, Sparkles, Image, MessageSquare, Laptop, ChevronLeft, ChevronRight, Star } from '../Common/Icons';
import api, { SERVER_URL } from '@/lib/api';
import YouTubeModal from '../Modals/YouTubeModal';
import { optimizeImage } from '@/utils/imageUtils';
import { useAppContext } from '../AppContext';

// Defined at module level so React doesn't treat it as a new component type on every render
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

const PromptCard = ({ prompt, isUnlocked, onUnlock, onLock, isHighlighted, searchTerm, isPriority = false, isMobile = false }) => {
  const { settings, isSettingsLoaded } = useAppContext();
  const [sliderValue, setSliderValue] = useState(Number(settings?.slider_default_position) || 50);
  const [pin, setPin] = useState('');
  const [showError, setShowError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRelocking, setIsRelocking] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // isMobile is now a prop from parent — no per-card resize listener needed

  const cardPadding = isMobile ? 10 : 18;

  const cardRef = React.useRef(null);
  const sliderContainerRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);


  React.useEffect(() => {
    if (settings?.slider_default_position) {
      setSliderValue(Number(settings.slider_default_position));
    }
  }, [settings?.slider_default_position]);

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
  }, [isUnlocked, prompt.isPremium, prompt.key]);

  const ratio = (prompt.image_ratio || prompt.imageRatio || '16/9').toString().replace(/\s+/g, '').trim();
  const aiType = prompt.aiType || '';
  const brandColor = aiType.toLowerCase().includes('chatgpt') ? '#10a37f' :
                    aiType.toLowerCase().includes('gemini') ? '#4285f4' :
                    aiType.toLowerCase().includes('midjourney') ? '#a855f7' : 
                    'rgba(255,255,255,0.4)';

  const handleSliderDragStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleSliderDragMove = useCallback((e) => {
    if (!isDraggingRef.current || !sliderContainerRef.current) return;
    e.preventDefault();
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderValue(percent);
  }, []);

  const handleSliderDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const checkAutoUnlock = (value) => {
    setPin(value);
    setShowError(false);
    const targetPass = String(prompt.password || '1234').trim();
    const inputPass = String(value || '').trim();

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



  const triggerConfetti = async () => {
    const box = document.getElementById(`box-${prompt.key}`);
    if (box) {
      const confetti = (await import('canvas-confetti')).default;
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
      if (prompt.isPremium || prompt.password) {
        setIsRelocking(true);
        setPin(''); // Clear PIN instantly for security
        
        // Hard Relock (Snappy 1000ms for Protected to allow Copied! feedback)
        setTimeout(() => {
          setIsCopied(false);
          setIsSnapping(false);
          setIsRelocking(false);
          onLock(); // Tell parent to relock
        }, 1000);
      } else {
        // Enhanced Celebration for Free Content
        const box = document.getElementById(`box-${prompt.key}`);
        if (box) {
          const confetti = (await import('canvas-confetti')).default;
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
        
        setTimeout(() => {
          setIsCopied(false);
          setIsSnapping(false);
        }, 2000);
      }
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


  const isListicle = !!prompt.website_category_id;

  if (isListicle) {
    return (
      <Link href={`/prompt/${prompt.slug || prompt.prompt_key || prompt.key}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <div className="listicle-card pro-card-hover glass-card" style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          overflow: 'hidden',
          transition: 'all 0.4s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          {/* 1200x628 Aspect Ratio Image */}
          <div style={{ width: '100%', aspectRatio: '1200 / 628', background: '#111', position: 'relative', overflow: 'hidden' }}>
            <img 
              src={optimizeImage(prompt.thumbnail_url || prompt.imgAfter || prompt.img_after || prompt.imgBefore || prompt.img_before, 600)} 
              alt={prompt.title} 
              loading={isPriority ? "eager" : "lazy"}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
              className="listicle-card-img"
            />
            {/* Tag / Badge */}
            {prompt.aiType && (
              <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'var(--accent-main)', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '6px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                {prompt.aiType}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.3, color: 'white' }}>
              {prompt.title}
            </h3>
            {/* Excerpt if description exists */}
            {prompt.description && (
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, lineHeight: 1.6 }}>
                {prompt.description.replace(/<[^>]*>?/gm, '')}
              </p>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-main)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Read Listicle <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

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
      {/* Premium Badge - Top Right */}
      {prompt.isPremium && (
        <div style={{
          position: 'absolute', 
          top: '12px', 
          right: '12px', 
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)', 
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 215, 0, 0.3)', 
          borderRadius: '50%',
          width: '36px', 
          height: '36px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center', 
          zIndex: 50, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          pointerEvents: 'none'
        }}>
          <Crown size={18} fill="#FFD700" color="#FFD700" />
        </div>
      )}



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
        marginBottom: (isUnlocked && prompt.isPremium) ? '0' : '8px',
        margin: `-${cardPadding}px -${cardPadding}px 0 -${cardPadding}px`,
        width: `calc(100% + ${cardPadding * 2}px)`,
        borderRadius: '24px 24px 0 0'
      }}>
        {/* Image Section */}
        {prompt.isImageSlider ? (
          <div ref={sliderContainerRef} className="slider-container prompt-image-container" style={{ 
            aspectRatio: ratio, width: '100%', margin: `0 0 15px 0`,
            position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border-color)',
            background: '#111',
            opacity: isSettingsLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}>
            <img 
              src={optimizeImage(prompt.thumbnail_url || prompt.imgAfter || prompt.img_after, isMobile ? 450 : 600)} 
              alt={`${prompt.title} - ${prompt.aiType || 'AI'} Prompt Result (After)`} 
              loading={isPriority ? "eager" : "lazy"} 
              fetchPriority={isPriority ? "high" : "auto"}
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              width="400" 
              height="225" 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <img 
              src={optimizeImage(prompt.imgBefore, isMobile ? 450 : 600)} 
              alt={`${prompt.title} - Original Input Image (Before)`} 
              loading={isPriority ? "eager" : "lazy"}
              fetchPriority={isPriority ? "high" : "auto"}
              decoding="async"
              width="400"
              height="225"
              style={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                WebkitClipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                zIndex: 2
              }} 
            />
            {/* Clickable overlay — navigates to prompt page on image click */}
            <Link 
              href={`/prompt/${prompt.slug || prompt.prompt_key || prompt.key}`}
              style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'pointer' }}
              aria-label={`View ${prompt.title}`}
            />
            {/* Divider line + draggable handle — only this triggers the slider, not clicking the image */}
            <div 
              onPointerDown={handleSliderDragStart}
              onPointerMove={handleSliderDragMove}
              onPointerUp={handleSliderDragEnd}
              style={{ 
                position: 'absolute', top: 0, bottom: 0, left: `${sliderValue}%`, width: '44px', 
                zIndex: 10, transform: 'translateX(-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'ew-resize',
                touchAction: 'none'
              }}>
              {/* Glowing divider line */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px',
                background: 'rgba(255, 255, 255, 0.8)', transform: 'translateX(-50%)', pointerEvents: 'none',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.15)'
              }} />
              {/* Glass capsule handle */}
              <div 
                style={{ 
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06))',
                  borderRadius: '14px', 
                  width: '28px', 
                  height: '52px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '2px',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 12px rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  flexShrink: 0,
                  pointerEvents: 'none',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <ChevronLeft size={14} color="rgba(255, 255, 255, 0.85)" strokeWidth={2.5} style={{ display: 'block' }} />
                <div style={{ width: '12px', height: '1px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '1px' }} />
                <ChevronRight size={14} color="rgba(255, 255, 255, 0.85)" strokeWidth={2.5} style={{ display: 'block' }} />
              </div>
            </div>
            

          </div>
        ) : (prompt.thumbnail_url || prompt.imgAfter || prompt.img_after || prompt.imgBefore || prompt.img_before) && (
          <div className="prompt-image-container" style={{ width: '100%', margin: `0 0 15px 0`, aspectRatio: ratio, background: '#111', overflow: 'hidden', position: 'relative' }}>
            <img 
              src={optimizeImage(prompt.thumbnail_url || prompt.imgAfter || prompt.img_after || prompt.imgBefore || prompt.img_before, isMobile ? 450 : 600)} 
              alt={`${prompt.title} - ${prompt.aiType || 'AI'} Prompt Example`} 
              loading={isPriority ? "eager" : "lazy"} 
              fetchPriority={isPriority ? "high" : "auto"}
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              width="400" 
              height="225" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            

          </div>
        )}
        {/* Header Info */}
        <Link href={`/prompt/${prompt.slug || prompt.prompt_key || prompt.key}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block', padding: `0 ${cardPadding}px` }}>
          {prompt.isFeatured && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid rgba(229, 9, 20, 0.3)', color: '#ff4d4d', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              <Star size={10} fill="#ff4d4d" color="#ff4d4d" />
              Featured
            </div>
          )}
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



    </div>
  );
};

export default PromptCard;

