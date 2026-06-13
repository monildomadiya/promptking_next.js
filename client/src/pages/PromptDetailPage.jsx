import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Copy, Check, Youtube, ArrowLeft, ArrowRight, Crown, Instagram, Activity, ChevronLeft, ChevronRight, CheckCircle, Eye } from '../components/Common/Icons';
import confetti from 'canvas-confetti';
import api from '../api';
import Shimmer from '../components/Common/Shimmer';
import YouTubeModal from '../components/Modals/YouTubeModal';
import SEOMetadata from '../components/SEO/SEOMetadata';
import AdSenseUnit from '../components/Ads/AdSenseUnit';
import { getCache, setCache } from '../utils/cacheUtils';

const PromptDetailPage = ({ adsSettings }) => {
  const { key } = useParams();
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  
  const [sliderValue, setSliderValue] = useState(50);
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRelocking, setIsRelocking] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const handleLike = async (e) => {
    e.preventDefault();
    if (isLiked) return;
    setIsLiked(true);
    setLikeCount(prev => prev + 1);
    try {
      await api.post('/record_like', { key });
    } catch (err) {
      console.error("Failed to record like:", err);
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    }
  };

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
    // Only scroll to top if not returning via back button,
    // though App.jsx handles global scroll. This local scroll might interfere,
    // but we can leave it or just remove it since App.jsx handles it.
    // Let's remove window.scrollTo(0, 0) since App.jsx does it properly now.
    fetchPrompt();
    fetchSuggestions();
  }, [key]);

  const fetchPrompt = async () => {
    const cacheKey = `pk_prompt_${key}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      setPrompt(cachedData);
      setIsUnlocked(!(cachedData.is_premium || cachedData.isPremium));
      setLoading(false);
      // Still revalidate in background silently
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get(`/prompt/${key}`);
      const p = response.data;
      const formattedPrompt = {
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
      };
      
      setCache(cacheKey, formattedPrompt);
      setPrompt(formattedPrompt);
      setLikeCount(formattedPrompt.likeCount || 0);
      
      if (!(formattedPrompt.is_premium || formattedPrompt.isPremium)) {
        setIsUnlocked(true);
      }
      
      // Track page view once the prompt is loaded
      api.post('/record_view', { key: formattedPrompt.key }).catch(err => {
        console.error("Failed to record view:", err);
      });
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching prompt:", err);
      if (!cachedData) {
        setError("Failed to load prompt details");
      }
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    const cacheKey = 'pk_suggestions_cache';
    const cachedData = getCache(cacheKey);
    if (cachedData && cachedData.length > 0) {
      // Filter out current key just in case
      setSuggestedPrompts(cachedData.filter(p => p.key !== key).slice(0, 6));
      return; // Stop execution to save bandwidth
    }

    // Fallback: check if home page cache has prompts
    const homeCache = getCache('pk_home_prompts');
    if (homeCache && homeCache.prompts) {
      const mapped = homeCache.prompts.map(p => ({
        ...p,
        promptText: p.prompt_text || p.promptText,
        imgAfter: p.img_after || p.imgAfter,
        imgBefore: p.img_before || p.imgBefore,
        isPremium: p.is_premium || p.isPremium,
        aiType: p.ai_type || p.aiType,
        key: p.prompt_key || p.key
      }));
      const topSuggestions = mapped.slice(0, 15);
      setCache(cacheKey, topSuggestions);
      setSuggestedPrompts(topSuggestions.filter(p => p.key !== key).slice(0, 6));
      return; // Stop execution
    }

    try {
      const response = await api.get('/get_data');
      if (response.data && response.data.prompts) {
        const mapped = response.data.prompts.map(p => ({
          ...p,
          promptText: p.prompt_text || p.promptText,
          imgAfter: p.img_after || p.imgAfter,
          imgBefore: p.img_before || p.imgBefore,
          isPremium: p.is_premium || p.isPremium,
          aiType: p.ai_type || p.aiType,
          key: p.prompt_key || p.key
        }));
        
        const topSuggestions = mapped.slice(0, 15); // Cache top 15
        setCache(cacheKey, topSuggestions);
        setSuggestedPrompts(topSuggestions.filter(p => p.key !== key).slice(0, 6));
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
      api.post('/record_unlock', { key: prompt.key }).catch(err => console.error("Failed to record unlock:", err));
      
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
               <div className="hero-section glass-panel" style={{
                 background: 'rgba(255, 255, 255, 0.02)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 borderRadius: '32px',
                 padding: '12px',
                 border: '1px solid rgba(255, 255, 255, 0.05)',
                 boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                 position: 'relative',
                 overflow: 'hidden'
               }}>
                  <Shimmer height="450px" borderRadius="24px" />
               </div>
               {/* Vault/Prompt Shimmer */}
               <div className="prompt-vault-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="prompt-area" style={{ 
                    background: 'rgba(15, 15, 20, 0.4)', 
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '32px', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    flex: 1,
                    minHeight: '350px'
                  }}>
                    <Shimmer height="100%" borderRadius="32px" style={{ background: 'transparent' }} />
                  </div>
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
      <a href="/" onClick={handleBack} style={{ padding: '12px 30px', background: 'white', color: 'black', borderRadius: '50px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Back to Home</a>
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

  // Parse FAQs
  let parsedFaqs = [];
  try { parsedFaqs = typeof prompt.faqs === 'string' ? JSON.parse(prompt.faqs) : (prompt.faqs || []); } catch(e) {}

  const promptSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    'name': prompt.title,
    'description': prompt.meta_description || prompt.description?.replace(/<[^>]*>?/gm, '').substring(0, 200) || '',
    'image': prompt.og_image || prompt.img_after || prompt.img_before || 'https://promptking.in/favicon.png',
    'url': prompt.canonical_url || `https://promptking.in/prompt/${prompt.key}`,
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

  const schemas = [promptSchema];
  if (parsedFaqs && parsedFaqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': parsedFaqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer }
      }))
    });
  }

  return (
    <div className="detail-page-wrapper" style={{ background: 'var(--surface-0)', minHeight: '100vh', color: 'white' }}>
      {/* CSS is in index.css — no inline <style> block needed */}
      <SEOMetadata 
        title={prompt.metaTitle || prompt.meta_title || `${prompt.title} - ${prompt.aiType || 'AI'} Prompt | PromptKing`}
        description={prompt.meta_description || prompt.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || `Unlock the "${prompt.title}" AI prompt on PromptKing. Works with ${prompt.aiType || 'AI'}.`}
        image={prompt.og_image || prompt.img_after || prompt.img_before || 'https://promptking.in/favicon.png'}
        url={prompt.canonical_url || `https://promptking.in/prompt/${prompt.key}`}
        canonicalUrlOverride={prompt.canonical_url}
        schema={schemas}
        ogTitle={prompt.og_title}
        ogDescription={prompt.og_description}
        ogImage={prompt.og_image}
        twitterTitle={prompt.twitter_title}
        twitterDescription={prompt.twitter_description}
        twitterImage={prompt.twitter_image}
        breadcrumb={[
          { name: 'Home', url: 'https://promptking.in/' },
          { name: 'Prompts', url: 'https://promptking.in/' },
          { name: prompt.title, url: `https://promptking.in/prompt/${prompt.key}` }
        ]}
      />
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Back Button */}
        <a href="/" onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '30px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }} className="back-link">
          <ArrowLeft size={18} /> Back
        </a>

        {/* 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '40px' }} className="detail-layout">
          
          {/* Main Content (Left) */}
          <article ref={contentRef} className="detail-main-content">
            
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
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Eye size={14} style={{ marginRight: '5px' }} />
                  {prompt.viewCount || 0} Views
                </span>
                <span onClick={handleLike} style={{ color: isLiked ? '#ec4899' : 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "#ec4899" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {likeCount} Likes
                </span>
              </div>
              <h1 className="prompt-detail-title" style={{ 
                fontSize: '2.4rem', 
                fontWeight: 900, 
                marginBottom: '15px', 
                lineHeight: 1.1, 
                letterSpacing: '-1px',
                background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>{prompt.title}</h1>
              
              {/* E-E-A-T Badges (Expertise, Authoritativeness, Trust) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="https://promptking.in/favicon.png" alt="PromptKing Logo" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>PromptKing Team</span>
                  <CheckCircle size={14} color="#27C93F" />
                  <span style={{ fontSize: '0.75rem', color: '#27C93F', fontWeight: 700, textTransform: 'uppercase' }}>Verified Expert</span>
                </div>
                <div style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}></div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  Updated on {new Date(prompt.updated_at || prompt.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Media & Prompt Split Container */}
            <div className="media-prompt-container" style={{ display: 'flex', gap: '40px', alignItems: 'stretch' }}>
              {/* Hero Section: Image Display */}
            <div className="hero-section glass-panel" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: '32px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              position: 'relative',
              overflow: 'hidden',
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
              gap: '20px'
            }}>
              {/* Interactive Vault Section */}
              <div id="box-detail" className={`prompt-area ${isUnlocked ? 'unlocked' : ''} ${isCopied && !prompt.isPremium ? 'copy-success-pulse-detail' : ''} ${isRelocking ? 'vault-relock-animate' : ''}`} style={{
              background: 'rgba(15, 15, 20, 0.4)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '32px', 
              position: 'relative', 
              overflow: 'hidden',
              display: 'flex', 
              flexDirection: 'column', 
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
                      <div
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className="gallery-thumb-item"
                        style={{
                          cursor: 'pointer', borderRadius: '16px', overflow: 'hidden',
                          aspectRatio: '1 / 1', border: '1px solid rgba(255,255,255,0.08)',
                          background: '#111', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04) translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
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
                      </div>
                    ))}
                  </div>

                  {/* Lightbox */}
                  {lightboxIndex !== null && (
                    <div
                      onClick={() => setLightboxIndex(null)}
                      style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(24px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                        animation: 'lightboxFadeIn 0.22s ease'
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
                      <img
                        key={lightboxIndex}
                        src={galleryImages[lightboxIndex]}
                        alt={`Gallery image ${lightboxIndex + 1}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          maxWidth: '90vw', maxHeight: '86vh', objectFit: 'contain',
                          borderRadius: '20px', boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          animation: 'lightboxImgIn 0.28s cubic-bezier(0.34,1.56,0.64,1)'
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
                    </div>
                  )}
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

            {/* Author Box */}
            <div className="author-box" style={{
              marginTop: '50px',
              padding: '40px',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(229,9,20,0.05) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              display: 'flex',
              gap: '30px',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50px', right: '-50px',
                width: '150px', height: '150px',
                background: 'var(--accent-main)',
                filter: 'blur(80px)',
                opacity: 0.15,
                borderRadius: '50%'
              }} />
              <div style={{ flexShrink: 0 }}>
                <img 
                  src={prompt.author_image ? optimizeImage(prompt.author_image, 150) : "https://github.com/monildomadiya.png"} 
                  alt={prompt.author_name || 'PromptKing Admin'} 
                  style={{ 
                    width: '90px', height: '90px', borderRadius: '50%', 
                    objectFit: 'cover', border: '3px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                  }} 
                  onError={(e) => { e.target.src = 'https://promptking.in/favicon.png' }}
                />
              </div>
              <div style={{ zIndex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Prompt Creator</div>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: '10px' }}>{prompt.author_name || 'PromptKing Admin'}</h4>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                  {prompt.author_description || 'Passionate about AI and creative workflows. Exploring the frontiers of prompt engineering to help you unlock the true potential of tools like ChatGPT, Midjourney, and Gemini.'}
                </p>
              </div>
            </div>

            {/* FAQ Section */}
            {parsedFaqs && parsedFaqs.length > 0 && (
              <section style={{ marginTop: '50px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                  <div style={{ width: '4px', height: '24px', background: 'var(--accent-main)', borderRadius: '2px' }} />
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: 'white' }}>
                    Frequently Asked Questions
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {parsedFaqs.map((faq, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'white', fontWeight: 700 }}>{faq.question}</h3>
                      <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </article>

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
    </div>
  );
};

export default PromptDetailPage;
