import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check, Youtube, ArrowLeft, ArrowRight, Crown, Instagram, Activity, ChevronLeft, ChevronRight } from '../components/Common/Icons';
import confetti from 'canvas-confetti';
import api from '../api';
import Shimmer from '../components/Common/Shimmer';
import YouTubeModal from '../components/Modals/YouTubeModal';
import SEOMetadata from '../components/SEO/SEOMetadata';
import AdSenseUnit from '../components/Ads/AdSenseUnit';
import { motion, AnimatePresence } from 'framer-motion';

const PromptDetailPage = ({ adsSettings }) => {
  const { key } = useParams();
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [sliderValue, setSliderValue] = useState(50);
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRelocking, setIsRelocking] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex(prev => {
        let galleryImages = [];
        try { const raw = prompt?.gallery_urls || prompt?.galleryUrls; if (raw) galleryImages = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch(err){}
        return (prev + 1) % galleryImages.length;
      });
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => {
        let galleryImages = [];
        try { const raw = prompt?.gallery_urls || prompt?.galleryUrls; if (raw) galleryImages = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch(err){}
        return (prev - 1 + galleryImages.length) % galleryImages.length;
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, prompt]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPrompt();
    fetchSuggestions();
  }, [key]);

  const fetchPrompt = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/prompt/${key}`);
      const p = response.data;
      setPrompt({
        ...p,
        promptText: p.prompt_text || p.promptText,
        imgAfter: p.img_after || p.imgAfter,
        imgBefore: p.img_before || p.imgBefore,
        isPremium: p.is_premium || p.isPremium,
        aiType: p.ai_type || p.aiType,
        imageRatio: p.image_ratio || p.imageRatio,
        isImageSlider: p.is_image_slider || p.isImageSlider,
        igLink: p.ig_link || p.igLink,
        metaTitle: p.meta_title || p.metaTitle,
        copyCount: p.copy_count || p.copy_count,
        key: p.prompt_key || p.key
      });
      if (!(p.is_premium || p.isPremium)) {
        setIsUnlocked(true);
      }
      
      // Track page view once the prompt is loaded
      try {
        await api.post('/record_unlock', { key: p.prompt_key || p.key });
      } catch (err) {
        console.error("Failed to record view:", err);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching prompt:", err);
      setError("Failed to load prompt details");
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await api.get('/get_data');
      if (response.data && response.data.prompts) {
        const mapped = response.data.prompts.filter(p => p.prompt_key !== key && p.key !== key).map(p => ({
          ...p,
          promptText: p.prompt_text || p.promptText,
          imgAfter: p.img_after || p.imgAfter,
          imgBefore: p.img_before || p.imgBefore,
          isPremium: p.is_premium || p.isPremium,
          aiType: p.ai_type || p.aiType,
          key: p.prompt_key || p.key
        }));
        setSuggestedPrompts(mapped.slice(0, 6));
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const handleSliderChange = (e) => {
    setSliderValue(e.target.value);
  };

  const checkAutoUnlock = async (value) => {
    setPin(value);
    setShowError(false);
    const targetPass = String(prompt?.password || '1234').trim();
    const inputPass = String(value || '').trim();
    
    if (inputPass === targetPass) {
      setIsUnlocked(true);
      triggerConfetti();
      
      // Auto-center the box so the user sees the unlocked content
      setTimeout(() => {
        const box = document.getElementById('box-detail');
        if (box) {
          const yOffset = -window.innerHeight / 2 + box.clientHeight / 2;
          const y = box.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
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



  const contentRef = React.useRef(null);

  useEffect(() => {
    if (isUnlocked && prompt?.password) {
      const box = document.getElementById('box-detail');
      if (box) {
        setTimeout(() => {
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [isUnlocked, prompt?.password]);

  const triggerConfetti = () => {
    const box = document.getElementById(`box-detail`);
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



  const handleCopy = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const brandedText = `${prompt.promptText}\n\n- Copied from PromptKing.in`;
      await navigator.clipboard.writeText(brandedText);
      await api.post('/record_copy', { key: prompt.key });
      setIsCopied(true);
      
      // Success Confetti for Free content
      const box = document.getElementById(`box-detail`);
      if (box) {
        const rect = box.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { x, y },
          colors: ['#e50914', '#FFD700', '#ffffff'],
          scale: 1,
          zIndex: 9999
        });
      }
      
      if (prompt.isPremium || prompt.password) {
        setIsRelocking(true);
        setPin(''); // Reset PIN for next use
        setTimeout(() => {
          setIsUnlocked(false);
          setIsRelocking(false);
        }, 1000);
      }

      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (loading) return (
    <div className="detail-page-wrapper" style={{ background: 'var(--surface-0)', minHeight: '100vh', color: 'white' }}>
      <SEOMetadata title="Loading Prompt... | PromptKing" />
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back Link Shimmer */}
        <Shimmer height="20px" width="180px" style={{ marginBottom: '30px' }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '40px' }} className="detail-layout">
          <div>
            {/* Header Shimmer */}
            <div style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                <Shimmer height="28px" width="80px" borderRadius="10px" />
                <Shimmer height="20px" width="180px" borderRadius="10px" />
              </div>
              <Shimmer height="50px" width="90%" borderRadius="12px" />
            </div>

            {/* Media & Prompt Container Shimmer */}
            <div className="media-prompt-container">
               {/* Hero Image Shimmer */}
               <div className="hero-section" style={{ marginBottom: '40px' }}>
                  <Shimmer height="450px" borderRadius="32px" />
               </div>
               {/* Vault/Prompt Shimmer */}
               <div className="prompt-area" style={{ marginBottom: '40px', minHeight: '350px' }}>
                  <Shimmer height="100%" borderRadius="32px" />
               </div>
            </div>

            {/* Description Section Shimmer */}
            <div style={{ marginTop: '20px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                  <Shimmer height="30px" width="220px" borderRadius="8px" />
               </div>
               <Shimmer height="20px" width="100%" style={{ marginBottom: '10px' }} />
               <Shimmer height="20px" width="95%" style={{ marginBottom: '10px' }} />
               <Shimmer height="20px" width="98%" style={{ marginBottom: '10px' }} />
               <Shimmer height="20px" width="60%" />
            </div>
          </div>

          <aside className="detail-sidebar">
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.05)', 
              borderRadius: '28px', 
              padding: '28px'
            }}>
               <Shimmer height="24px" width="180px" style={{ marginBottom: '24px' }} />
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[1, 2, 3, 4].map(i => (
                     <div key={i} style={{ display: 'flex', gap: '14px', padding: '12px' }}>
                        <Shimmer height="65px" width="85px" borderRadius="12px" />
                        <div style={{ flex: 1 }}>
                           <Shimmer height="15px" width="100%" style={{ marginBottom: '8px' }} />
                           <Shimmer height="15px" width="60%" />
                        </div>
                     </div>
                  ))}
               </div>
               <Shimmer height="200px" borderRadius="20px" style={{ marginTop: '30px' }} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

  if (error || !prompt) return (
    <div style={{ padding: '150px 20px', textAlign: 'center', background: 'var(--bg-color)', minHeight: '100vh' }}>
      <SEOMetadata title="Prompt Not Found | PromptKing" />
      <h2 style={{ color: 'var(--accent-main)', marginBottom: '20px' }}>{error || "Prompt not found"}</h2>
      <Link to="/" style={{ padding: '12px 30px', background: 'white', color: 'black', borderRadius: '50px', fontWeight: 700 }}>Back to Home</Link>
    </div>
  );

  const aiType = prompt.aiType || '';
  const brandColor = aiType.toLowerCase().includes('chatgpt') ? '#10a37f' :
                    aiType.toLowerCase().includes('gemini') ? '#4285f4' :
                    aiType.toLowerCase().includes('midjourney') ? '#a855f7' : 
                    'rgba(255,255,255,0.4)';
  const badgeClass = aiType.toLowerCase().includes('chatgpt') ? 'chatgpt' : 
                   aiType.toLowerCase().includes('gemini') ? 'gemini' : 
                   aiType.toLowerCase().includes('midjourney') ? 'midjourney' : '';

  const optimizeImage = (url, width = 800) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      return `/api/optimize?src=${encodeURIComponent(url)}&w=${width}`;
    }
    return url;
  };

  const promptSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    'name': prompt.title,
    'description': prompt.description,
    'image': prompt.img_after || prompt.img_before || 'https://promptking.in/favicon.png',
    'url': `https://promptking.in/prompt/${prompt.key}`,
    'keywords': `${prompt.aiType || 'AI'} prompt, ${prompt.title}, prompt engineering, PromptKing`,
    'genre': prompt.aiType || 'AI Prompt',
    'inLanguage': 'en',
    'isAccessibleForFree': !prompt.isPremium,
    'publisher': {
      '@type': 'Organization',
      'name': 'PromptKing',
      'url': 'https://promptking.in',
      'logo': 'https://promptking.in/favicon.png'
    },
    'author': {
      '@type': 'Organization',
      'name': 'PromptKing',
      'url': 'https://promptking.in'
    }
  };

  return (
    <div className="detail-page-wrapper" style={{ background: 'var(--surface-0)', minHeight: '100vh', color: 'white' }}>
      <SEOMetadata 
        title={prompt.metaTitle || `${prompt.title} - ${prompt.aiType || 'AI'} Prompt | PromptKing`}
        description={prompt.description?.slice(0, 160) || `Unlock the "${prompt.title}" AI prompt on PromptKing. Works with ${prompt.aiType || 'AI'}.`}
        image={prompt.img_after || prompt.img_before || 'https://promptking.in/favicon.png'}
        url={`https://promptking.in/prompt/${prompt.key}`}
        schema={promptSchema}
        breadcrumb={[
          { name: 'Home', url: 'https://promptking.in/' },
          { name: 'Prompts', url: 'https://promptking.in/' },
          { name: prompt.title, url: `https://promptking.in/prompt/${prompt.key}` }
        ]}
      />
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Back Button */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '30px', fontWeight: 600, textDecoration: 'none' }} className="back-link">
          <ArrowLeft size={18} /> Back to Explorer
        </Link>

        {/* 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '40px' }} className="detail-layout">
          
          {/* Main Content (Left) */}
          <div ref={contentRef} className="detail-main-content">
            
            {/* Header Section: Title & Stats */}
            <div style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                <span className={`badge ${badgeClass}`} style={{ 
                  fontSize: '0.75rem', 
                  padding: '6px 16px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${brandColor || 'rgba(255,255,255,0.1)'}`,
                  color: brandColor || 'white'
                }}>{prompt.aiType || 'AI'}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Activity size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  {prompt.copyCount || 0} Successful Copies
                </span>
              </div>
              <h1 className="prompt-detail-title" style={{ 
                fontSize: '2.4rem', 
                fontWeight: 900, 
                marginBottom: '10px', 
                lineHeight: 1.1, 
                letterSpacing: '-1px',
                background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>{prompt.title}</h1>
            </div>

            {/* Media & Prompt Split Container */}
            <div className="media-prompt-container" style={{
              display: 'flex',
              flexDirection: window.innerWidth <= 1100 ? 'column' : 'row',
              gap: '40px',
              alignItems: window.innerWidth <= 1100 ? 'flex-start' : 'stretch',
              marginBottom: window.innerWidth <= 1100 ? '0' : '40px'
            }}>
              {/* Hero Section: Image Display */}
            <div className="hero-section glass-panel" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: '32px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              marginBottom: window.innerWidth <= 1100 ? '20px' : '0',
              position: 'relative',
              overflow: 'hidden',
              width: window.innerWidth <= 1100 ? '100%' : 'calc(60% - 20px)',
              flexShrink: 0
            }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
                {prompt.isImageSlider ? (
                  <div className="slider-container" style={{ position: 'relative', aspectRatio: (prompt.image_ratio || prompt.imageRatio || '16 / 9').replace(/\s+/g, ' ').trim(), width: '100%' }}>
                    <img src={optimizeImage(prompt.imgAfter)} alt={`${prompt.title} - ${prompt.aiType || 'AI'} Generated Prompt Result (After)`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <img 
                      src={optimizeImage(prompt.imgBefore)} 
                      alt={`${prompt.title} - Original Photo for AI Prompt (Before)`} 
                      style={{ 
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                        clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                        WebkitClipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                        zIndex: 2
                      }} 
                    />
                    <div style={{ 
                      position: 'absolute', top: 0, bottom: 0, left: `${sliderValue}%`, width: '3px', 
                      background: 'white', zIndex: 3, transform: 'translateX(-50%)'
                    }}>
                      <div 
                        style={{ 
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                          background: 'rgba(255, 255, 255, 0.7)', 
                          color: 'black', 
                          borderRadius: '30px', 
                          width: '26px', 
                          height: '52px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '-10px',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', 
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
                      style={{ position: 'absolute', inset: 0, zIndex: 10, opacity: 0, cursor: 'ew-resize', width: '100%', height: '100%' }}
                    />
                  </div>
                ) : (prompt.imgAfter || prompt.imgBefore) && (
                  <div style={{ width: '100%', aspectRatio: (prompt.image_ratio || prompt.imageRatio || '16 / 9').replace(/\s+/g, ' ').trim(), background: '#111', position: 'relative' }}>
                    <img src={optimizeImage(prompt.imgAfter || prompt.imgBefore)} alt={`${prompt.title} - High Quality ${prompt.aiType || 'AI'} Prompt Example`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                

              </div>
            </div>

            {/* Right Column: Prompt Vault & Buttons */}
            <div className="prompt-vault-column" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              width: window.innerWidth <= 1100 ? '100%' : 'calc(40% - 20px)',
              gap: '20px'
            }}>
              {/* Interactive Vault Section */}
              <div id="box-detail" className={`prompt-area ${isUnlocked ? 'unlocked' : ''} ${isCopied && !prompt.isPremium ? 'copy-success-pulse' : ''} ${isRelocking ? 'vault-relock-animate' : ''}`} style={{
              background: 'rgba(15, 15, 20, 0.4)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '32px', 
              position: 'relative', 
              overflow: 'hidden',
              display: 'flex', 
              flexDirection: 'column', 
              marginBottom: window.innerWidth <= 1100 ? '20px' : '0', 
              border: isUnlocked ? (prompt.isPremium ? '2px solid #FFD700' : (isCopied ? '2px solid #27C93F' : '2px solid var(--accent-main)')) : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isUnlocked ? (prompt.isPremium ? '0 15px 50px rgba(255, 215, 0, 0.15)' : (isCopied ? '0 15px 50px rgba(39, 201, 63, 0.3)' : '0 15px 50px rgba(229, 9, 20, 0.2)')) : 'none',
              transform: isUnlocked ? (isCopied && !prompt.isPremium ? 'scale(1.02)' : 'scale(1.01)') : 'scale(1)',
              minHeight: '350px',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              height: '100%',
              flex: 1
            }}>
              {/* Vault Header */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F56', opacity: 0.8 }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E', opacity: 0.8 }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27C93F', opacity: 0.8 }}></div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {isUnlocked ? 'Encrypted Data Accessed' : 'Security Vault Locked'}
                </div>
              </div>
              
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  position: 'absolute', inset: 0, padding: '25px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9rem', color: '#fff', lineHeight: 1.8,
                  filter: (isUnlocked && !isRelocking) ? 'none' : 'blur(12px)', 
                  WebkitFilter: (isUnlocked && !isRelocking) ? 'none' : 'blur(12px)',
                  userSelect: (isUnlocked && !isRelocking) ? 'text' : 'none', 
                  overflowY: (isUnlocked && !isRelocking) ? 'auto' : 'hidden',
                  transition: 'filter 0.5s ease-out, -webkit-filter 0.5s ease-out'
                }}>
                  {prompt.promptText}
                </div>

                {isUnlocked && (
                  <button 
                    onClick={handleCopy}
                    className="pro-card-hover"
                    style={{
                      position: 'absolute',
                      bottom: '15px',
                      right: '15px',
                      background: isCopied ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      zIndex: 20,
                      backdropFilter: 'blur(5px)',
                      transition: 'all 0.3s ease',
                      animation: isCopied ? 'copyButtonPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
                    }}
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    {isCopied ? 'Copied!' : 'Copy'}

                    {/* Floating Toast Indicator */}
                    {isCopied && (
                      <span style={{
                        position: 'absolute',
                        top: '-40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--accent-main)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
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

                {(!isUnlocked || isRelocking) && (
                  <div className={`lock-overlay-base ${isRelocking ? 'lock-overlay-animate' : ''}`} style={{ 
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', zIndex: 10, gap: '20px'
                  }}>
                    <div style={{ width: '100%', maxWidth: '200px' }}>
                      <form onSubmit={(e) => e.preventDefault()}>
                        <input 
                          type="password" 
                          placeholder="••••" 
                          value={pin}
                          onChange={(e) => checkAutoUnlock(e.target.value)}
                          style={{ 
                            width: '100%',
                            height: '55px',
                            borderRadius: '16px',
                            border: showError ? '2px solid #ff4444' : '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white', 
                            textAlign: 'center', 
                            outline: 'none', 
                            letterSpacing: '8px', 
                            fontSize: '1.6rem', 
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                          }} 
                        />
                      </form>
                    </div>

                    {showError && <p style={{ color: '#ff4444', fontSize: '0.8rem', fontWeight: 700 }}>Verification Failed</p>}
                    
                    {prompt.igLink && (
                      <button 
                        onClick={() => setShowVideoModal(true)}
                        style={{ 
                          background: 'rgba(255,255,255,0.03)', 
                          fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '8px', 
                          padding: '8px 16px', borderRadius: '10px',
                          textDecoration: 'none', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => { 
                          const isMobile = window.innerWidth <= 1100;
                          if (!isMobile) {
                            e.currentTarget.style.color = 'white'; 
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; 
                          }
                        }}
                        onMouseOut={(e) => { 
                          const isMobile = window.innerWidth <= 1100;
                          if (!isMobile) {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; 
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; 
                          }
                        }}
                      >
                        {prompt.igLink.includes('instagram') ? (
                          <Instagram size={14} />
                        ) : (
                          <Youtube size={14} />
                        )}
                        Get PIN from {prompt.igLink.includes('instagram') ? 'Reel' : 'Short'}
                      </button>
                    )}
                  </div>
                )}
                
                {prompt?.isPremium && (
                  <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
                    <div style={{
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      width: '46px',
                      height: '46px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Crown size={22} fill="#FFD700" color="#FFD700" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(!isUnlocked && !prompt.isPremium) && (
              <button 
                onClick={handleCopy}
                style={{
                  width: '100%', background: isCopied ? 'var(--success)' : 'white', color: isCopied ? 'white' : 'black',
                  border: 'none', padding: '18px', borderRadius: '20px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.3s ease',
                  boxShadow: isCopied ? '0 0 30px rgba(39, 201, 63, 0.3)' : '0 10px 30px rgba(0,0,0,0.3)',
                  marginTop: '0px',
                  marginBottom: window.innerWidth <= 1100 ? '20px' : '0'
                }}
              >
                {isCopied ? <><Check size={22} /> Copied!</> : <><Copy size={22} /> Copy Full Prompt</>}
              </button>
            )}

            </div> {/* Close Right Column */}
            </div> {/* Close Media & Prompt Split */}

            <YouTubeModal 
              isOpen={showVideoModal} 
              onClose={() => setShowVideoModal(false)} 
              videoUrl={prompt.igLink} 
            />

            <div style={{ 
              marginTop: '10px', 
              marginBottom: '30px', 
              padding: '16px 20px', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '16px', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderLeft: '4px solid var(--accent-main)'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
                <strong style={{ color: 'white' }}>Tip:</strong> Use different AI tools to get the best results.
              </p>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
                <strong style={{ color: 'white' }}>Note:</strong> The final edited image may vary based on the original photo.
              </p>
            </div>

            {/* Gallery Section - Moved below Notes & Tips */}
            {(() => {
              let galleryImages = [];
              try {
                const raw = prompt.gallery_urls || prompt.galleryUrls;
                if (raw) galleryImages = typeof raw === 'string' ? JSON.parse(raw) : raw;
              } catch(e) {}
              if (!Array.isArray(galleryImages) || galleryImages.length === 0) return null;
              return (
                <div style={{ marginTop: '20px', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '4px', height: '24px', background: 'var(--accent-main)', borderRadius: '2px' }} />
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>Image Gallery</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {galleryImages.map((imgUrl, idx) => (
                      <motion.div
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        whileHover={{ scale: 1.04, y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        style={{
                          cursor: 'pointer', borderRadius: '16px', overflow: 'hidden',
                          aspectRatio: '1 / 1', border: '1px solid rgba(255,255,255,0.08)',
                          background: '#111', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                        }}
                      >
                        <img
                          src={imgUrl} alt={`${prompt.title} - ${prompt.aiType || 'AI'} Gallery Image ${idx + 1}`} loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
                          display: 'flex', alignItems: 'flex-end', padding: '10px 12px'
                        }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 700 }}>View ↗</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Lightbox */}
                  <AnimatePresence>
                    {lightboxIndex !== null && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={() => setLightboxIndex(null)}
                        style={{
                          position: 'fixed', inset: 0, zIndex: 9999,
                          background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(24px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                        }}
                      >
                        {/* Close */}
                        <button
                          onClick={() => setLightboxIndex(null)}
                          style={{
                            position: 'absolute', top: '20px', right: '24px', zIndex: 10001,
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', width: '44px', height: '44px', borderRadius: '50%',
                            fontSize: '1.3rem', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,9,20,0.5)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        >✕</button>

                        {/* Prev */}
                        {galleryImages.length > 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length); }}
                            style={{
                              position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10001,
                              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                              color: 'white', width: '50px', height: '50px', borderRadius: '50%',
                              fontSize: '1.5rem', cursor: 'pointer', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                          >‹</button>
                        )}

                        {/* Image */}
                        <motion.img
                          key={lightboxIndex}
                          initial={{ opacity: 0, scale: 0.88 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.88 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                          src={galleryImages[lightboxIndex]}
                          alt={`Gallery image ${lightboxIndex + 1}`}
                          onClick={e => e.stopPropagation()}
                          style={{
                            maxWidth: '90vw', maxHeight: '86vh', objectFit: 'contain',
                            borderRadius: '20px', boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        />

                        {/* Next */}
                        {galleryImages.length > 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % galleryImages.length); }}
                            style={{
                              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10001,
                              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                              color: 'white', width: '50px', height: '50px', borderRadius: '50%',
                              fontSize: '1.5rem', cursor: 'pointer', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                          >›</button>
                        )}

                        {/* Counter */}
                        <div style={{
                          position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)',
                          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.8rem', fontWeight: 700, padding: '6px 18px', borderRadius: '20px', letterSpacing: '1px'
                        }}>
                          {lightboxIndex + 1} / {galleryImages.length}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* Re-inserted copy button above */}

            {/* In-Content Ad Placement */}
            {adsSettings?.adsense_enabled === '1' && adsSettings?.adsense_slot_detail && (
              <div style={{ marginBottom: '40px' }}>
                <AdSenseUnit client={adsSettings.adsense_client_id} slot={adsSettings.adsense_slot_detail} />
              </div>
            )}

            {/* Content Section: Description */}
            <div className="detail-description-section" style={{
              padding: '20px 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                <div style={{ width: '4px', height: '24px', background: 'var(--accent-main)', borderRadius: '2px' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
                  Logic & Instructions
                </h3>
              </div>
              <div 
                className="blog-content" 
                style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, fontSize: '1.1rem' }}
                dangerouslySetInnerHTML={{ __html: prompt.description || '' }}
              />
            </div>

            {/* NEW: How to Use Prompt Section */}
            <section className="how-to-use-section" style={{ padding: '30px 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                <div style={{ width: '4px', height: '24px', background: 'var(--accent-main)', borderRadius: '2px' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: 'white' }}>
                  How to Use this AI Prompt?
                </h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {[
                  { step: "01", title: "Copy Prompt", desc: "Click the copy button above to instantly capture the full, optimized prompt text to your clipboard." },
                  { step: "02", title: "Choose AI Tool", desc: "Open your favorite AI website like ChatGPT, Midjourney, or Bing. Trying different tools can give you even more amazing and professional results." },
                  { step: "03", title: "Paste & Customize", desc: "Paste the prompt into the tool. You can easily tweak any part of the text to match your exact creative vision." },
                  { step: "04", title: "Generate Magic", desc: "Press enter and watch as the AI generates stunning, high-quality results based on your custom prompt in seconds." }
                ].map((item, i) => (
                  <div key={i} style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '24px', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ color: 'var(--accent-main)', fontSize: '0.8rem', fontWeight: 900, marginBottom: '10px', opacity: 0.6 }}>STEP {item.step}</div>
                    <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>{item.title}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>


          </div>

          {/* Sidebar (Right) */}
          <aside className="detail-sidebar">
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.05)', 
              borderRadius: '28px', 
              padding: '28px', 
              position: 'sticky', 
              top: '110px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '3px', height: '20px', background: 'var(--accent-main)', borderRadius: '2px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
                  Related Creations
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {suggestedPrompts.map(s => (
                  <Link 
                    key={s.key} 
                    to={`/prompt/${s.slug || s.prompt_key || s.key}`} 
                    style={{ 
                      display: 'flex', 
                      gap: '14px', 
                      textDecoration: 'none', 
                      color: 'inherit',
                      padding: '12px',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} 
                    className="suggested-card-item"
                  >
                    <div style={{ 
                      width: '85px', 
                      height: '65px', 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      flexShrink: 0, 
                      background: '#111',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <img src={s.imgAfter} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.5s' }} className="suggestion-img" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                      <h4 style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 700, 
                        lineHeight: 1.3, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        color: 'rgba(255,255,255,0.9)'
                      }}>{s.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          color: s.aiType?.toLowerCase().includes('chatgpt') ? '#10a37f' : (s.aiType?.toLowerCase().includes('gemini') ? '#4285f4' : 'var(--accent-main)'), 
                          fontWeight: 800, 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>{s.aiType}</span>
                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Pro Choice</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div style={{ 
                marginTop: '28px', 
                padding: '24px', 
                background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.1), rgba(229, 9, 20, 0.02))', 
                borderRadius: '20px', 
                border: '1px solid rgba(229, 9, 20, 0.15)',
                textAlign: 'center'
              }}>
                <Crown size={28} color="var(--accent-main)" style={{ marginBottom: '12px', opacity: 0.8 }} />
                <h5 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '6px' }}>King Community</h5>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Unlock exclusive masterclasses and premium prompt engineering strategies.
                </p>
                <button style={{ 
                  width: '100%',
                  background: 'var(--accent-main)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem', 
                  fontWeight: 800, 
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(229, 9, 20, 0.2)'
                }}>Coming Soon</button>
              </div>

              {/* Sidebar Ad Placement */}
              {adsSettings?.adsense_enabled === '1' && adsSettings?.adsense_slot_sidebar && (
                <div style={{ marginTop: '20px' }}>
                  <AdSenseUnit client={adsSettings.adsense_client_id} slot={adsSettings.adsense_slot_sidebar} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

<style>{`
        .detail-page-wrapper { animation: none; }
        @keyframes fadeIn { from { opacity: 1; transform: translateY(0); } to { opacity: 1; transform: translateY(0); } }
        .back-link { transition: 0.3s; }
        @media (hover: hover) {
          .back-link:hover { color: white !important; transform: translateX(-5px); }
          .suggested-card-item:hover { 
            transform: translateY(-3px) translateX(4px); 
            background: rgba(255,255,255,0.06) !important;
            border-color: rgba(229, 9, 20, 0.2) !important;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          }
          .suggested-card-item:hover .suggestion-img { transform: scale(1.1); }
          .suggested-card-item:hover h4 { color: var(--accent-main) !important; }
        }
        .chatgpt { color: #10a37f; background: rgba(16, 163, 127, 0.08) !important; border-color: rgba(16, 163, 127, 0.3) !important; }
        
        @keyframes copyPulseDetail {
          0% { transform: scale(1.01); border-color: var(--accent-main); }
          50% { transform: scale(1.02); border-color: #27C93F; box-shadow: 0 0 60px rgba(39, 201, 63, 0.4); }
          100% { transform: scale(1.01); border-color: #27C93F; }
        }

        .copy-success-pulse {
          animation: copyPulseDetail 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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

        .gemini { color: #4285f4; background: rgba(66, 133, 244, 0.08) !important; border-color: rgba(66, 133, 244, 0.3) !important; }
        .midjourney { color: #a855f7; background: rgba(168, 85, 247, 0.08) !important; border-color: rgba(168, 85, 247, 0.3) !important; }
        .blog-content img { max-width: 100%; border-radius: 15px; margin: 20px 0; }
        .blog-content h2, .blog-content h3 { color: white; margin-top: 35px; margin-bottom: 20px; }
        
        @media (min-width: 1025px) {
          .media-prompt-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            align-items: stretch;
            margin-bottom: 40px;
          }
          .media-prompt-container .hero-section {
            margin-bottom: 0 !important;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .media-prompt-container .hero-section > div {
            flex: 1;
            display: flex;
            align-items: center;
          }
          .media-prompt-container .prompt-area {
            margin-bottom: 0 !important;
          }
        }
        
        @media (max-width: 1024px) {
          .detail-layout { grid-template-columns: 1fr !important; }
          .detail-sidebar { display: none; }
        }
        @media (max-width: 768px) {
          .detail-main { border-radius: 15px !important; padding: 15px !important; }
          .prompt-area { border-radius: 15px !important; }
        }
      `}</style>
    </div>
  );
};

export default PromptDetailPage;
