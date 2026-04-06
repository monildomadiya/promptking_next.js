import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check, Youtube, ArrowLeft, ArrowRight, Crown, Instagram, Heart, Activity, ChevronLeft, ChevronRight } from '../components/Common/Icons';
import confetti from 'canvas-confetti';
import api from '../api';
import Shimmer from '../components/Common/Shimmer';
import YouTubeModal from '../components/Modals/YouTubeModal';
import SEOMetadata from '../components/SEO/SEOMetadata';
import AdSenseUnit from '../components/Ads/AdSenseUnit';

const PromptDetailPage = ({ user, adsSettings }) => {
  const { key } = useParams();
  const [prompt, setPrompt] = useState(null);
  const [showAuthHint, setShowAuthHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [sliderValue, setSliderValue] = useState(50);
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);

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
        copyCount: p.copy_count || p.copy_count,
        key: p.prompt_key || p.key
      });
      if (!(p.is_premium || p.isPremium)) {
        setIsUnlocked(true);
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
      try {
        await api.post('/record_unlock', { key: prompt.key }); // Record as unlock
      } catch (err) {
        console.error("Failed to record correct attempt:", err);
      }
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
    // Scroll into view removed to eliminate scroll animation effects
  }, [isUnlocked]);

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



  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
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

      // Relock smoothly only for Premium content
      if (prompt.isPremium) {
        setTimeout(() => {
          setIsUnlocked(false);
        }, 200);
      }
      
      setTimeout(() => {
        setIsCopied(false);
        setPin(''); // Reset PIN
      }, 800);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (loading) return (
    <div className="detail-page-wrapper" style={{ background: 'var(--surface-0)', minHeight: '100vh', color: 'white' }}>
      <SEOMetadata title="Loading Prompt... | PromptKing" />
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        <Shimmer height="20px" width="150px" style={{ marginBottom: '30px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '40px' }} className="detail-layout">
          <div>
            <div style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                <Shimmer height="30px" width="100px" borderRadius="10px" />
                <Shimmer height="30px" width="150px" borderRadius="10px" />
              </div>
              <Shimmer height="50px" width="80%" />
            </div>
            <Shimmer height="500px" borderRadius="32px" style={{ marginBottom: '40px' }} />
            <Shimmer height="200px" borderRadius="32px" style={{ marginBottom: '40px' }} />
          </div>
          <aside className="detail-sidebar">
            <Shimmer height="600px" borderRadius="28px" />
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
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": prompt.title,
    "description": prompt.description,
    "image": prompt.img_after || prompt.img_before,
    "author": {
      "@type": "Organization",
      "name": "PromptKing"
    }
  };

  return (
    <div className="detail-page-wrapper" style={{ background: 'var(--surface-0)', minHeight: '100vh', color: 'white' }}>
      <SEOMetadata 
        title={`${prompt.title} - AI Prompt | PromptKing`}
        description={prompt.description?.slice(0, 160)}
        image={prompt.img_after || prompt.img_before}
        schema={promptSchema}
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
              <h1 style={{ 
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

            {/* Hero Section: Image Display */}
            <div className="hero-section glass-panel" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: '32px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              marginBottom: '40px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
                {prompt.isImageSlider ? (
                  <div className="slider-container" style={{ position: 'relative', aspectRatio: (prompt.image_ratio || prompt.imageRatio || '16 / 9').replace(/\s+/g, ' ').trim(), width: '100%' }}>
                    <img src={optimizeImage(prompt.imgAfter)} alt="After" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <img 
                      src={optimizeImage(prompt.imgBefore)} 
                      alt="Before" 
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
                    <img src={optimizeImage(prompt.imgAfter || prompt.imgBefore)} alt={prompt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

            {/* Interactive Vault Section */}
            <div id="box-detail" className={`prompt-area ${isUnlocked ? 'unlocked' : ''} ${isCopied && !prompt.isPremium ? 'copy-success-pulse' : ''}`} style={{
              background: 'rgba(15, 15, 20, 0.4)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '32px', 
              position: 'relative', 
              overflow: 'hidden',
              display: 'flex', 
              flexDirection: 'column', 
              marginBottom: '40px', 
              border: isUnlocked ? (prompt.isPremium ? '2px solid #FFD700' : (isCopied ? '2px solid #27C93F' : '2px solid var(--accent-main)')) : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isUnlocked ? (prompt.isPremium ? '0 15px 50px rgba(255, 215, 0, 0.15)' : (isCopied ? '0 15px 50px rgba(39, 201, 63, 0.3)' : '0 15px 50px rgba(229, 9, 20, 0.2)')) : 'none',
              transform: isUnlocked ? (isCopied && !prompt.isPremium ? 'scale(1.02)' : 'scale(1.01)') : 'scale(1)',
              minHeight: isUnlocked ? (prompt.isPremium ? '240px' : '150px') : '180px',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
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
                  filter: (isUnlocked) ? 'none' : 'blur(12px)', 
                  WebkitFilter: (isUnlocked) ? 'none' : 'blur(12px)',
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
                      bottom: '20px',
                      right: '20px',
                      background: isCopied ? '#27C93F' : 'white',
                      border: 'none',
                      color: isCopied ? 'white' : 'black',
                      padding: '10px 24px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      zIndex: 20,
                      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    {isCopied ? 'Copied' : 'Copy Prompt'}
                  </button>
                )}

                {!isUnlocked && (
                  <div style={{ 
                    position: 'absolute', inset: 0, background: 'rgba(10, 10, 12, 0.8)', 
                    backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
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
                          const isMobile = window.innerWidth <= 768;
                          if (!isMobile) {
                            e.currentTarget.style.color = 'white'; 
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; 
                          }
                        }}
                        onMouseOut={(e) => { 
                          const isMobile = window.innerWidth <= 768;
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
              </div>
            </div>

            <YouTubeModal 
              isOpen={showVideoModal} 
              onClose={() => setShowVideoModal(false)} 
              videoUrl={prompt.igLink} 
            />

            {(!isUnlocked && !prompt.isPremium) && (
              <button 
                onClick={handleCopy}
                style={{
                  width: '100%', background: isCopied ? 'var(--success)' : 'white', color: isCopied ? 'white' : 'black',
                  border: 'none', padding: '18px', borderRadius: '20px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.3s ease',
                  boxShadow: isCopied ? '0 0 30px rgba(39, 201, 63, 0.3)' : '0 10px 30px rgba(0,0,0,0.3)',
                  marginBottom: '30px'
                }}
              >
                {isCopied ? <><Check size={22} /> Copied!</> : <><Copy size={22} /> Copy Full Prompt</>}
              </button>
            )}

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

        .gemini { color: #4285f4; background: rgba(66, 133, 244, 0.08) !important; border-color: rgba(66, 133, 244, 0.3) !important; }
        .midjourney { color: #a855f7; background: rgba(168, 85, 247, 0.08) !important; border-color: rgba(168, 85, 247, 0.3) !important; }
        .blog-content img { max-width: 100%; border-radius: 15px; margin: 20px 0; }
        .blog-content h2, .blog-content h3 { color: white; margin-top: 35px; margin-bottom: 20px; }
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
