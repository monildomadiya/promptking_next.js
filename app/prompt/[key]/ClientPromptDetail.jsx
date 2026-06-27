"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Copy, Check, Youtube, ArrowLeft, ArrowRight, Crown, Instagram, ChevronLeft, ChevronRight, CheckCircle, Tag, X } from '@/components/Common/Icons';
import confetti from 'canvas-confetti';
import api from '@/lib/api';
import Shimmer from '@/components/Common/Shimmer';
import Link from 'next/link';
import YouTubeModal from '@/components/Modals/YouTubeModal';
import SEOMetadata from '@/components/SEO/SEOMetadata';
import AdSenseUnit from '@/components/Ads/AdSenseUnit';
import { getCache, setCache } from '@/utils/cacheUtils';
import { useAppContext } from '@/components/AppContext';

const OTPInput = ({ value, onChange, length = 4, showError }) => {
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Allow empty string for backspace or single digit
    const char = val.substring(val.length - 1);
    
    const pinArray = value.padEnd(length, ' ').split('');
    pinArray[index] = char || ' ';
    const newPin = pinArray.join('').trimEnd();
    
    onChange(newPin);
    
    if (char && char !== ' ' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    if (!pastedData) return;
    
    onChange(pastedData);
    
    if (pastedData.length < length) {
      inputRefs.current[pastedData.length]?.focus();
    } else {
      inputRefs.current[length - 1]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="password"
          inputMode="numeric"
          maxLength={2}
          value={value[index] && value[index] !== ' ' ? value[index] : ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          style={{
            width: '50px',
            height: '60px',
            borderRadius: '16px',
            border: showError ? '2px solid #ff4444' : '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
            color: 'white',
            textAlign: 'center',
            outline: 'none',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: value[index] && value[index] !== ' ' ? '0 0 15px rgba(255,215,0,0.2)' : 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-main)'}
          onBlur={(e) => e.target.style.borderColor = showError ? '#ff4444' : 'rgba(255,255,255,0.05)'}
        />
      ))}
    </div>
  );
};

const ClientPromptDetail = ({ initialPrompt, initialSuggestedPrompts, adsSettings }) => {
  const { isMobile } = useAppContext();
  const { key } = useParams();
  const [prompt, setPrompt] = useState(initialPrompt || null);
  const [loading, setLoading] = useState(!initialPrompt);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleBack = (e) => {
    e.preventDefault();
    router.back();
  };

  const [sliderValue, setSliderValue] = useState(50);
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRelocking, setIsRelocking] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState(initialSuggestedPrompts || []);
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
    if (initialPrompt) {
      setIsUnlocked(!(initialPrompt.is_premium || initialPrompt.isPremium));
    } else {
      fetchPrompt();
    }
    if (!initialSuggestedPrompts || initialSuggestedPrompts.length === 0) {
      fetchSuggestions();
    }
    
    // Record view
    api.post('/record_view', { key: key }).catch(err => console.error("Failed to record view:", err));
  }, [key, initialPrompt, initialSuggestedPrompts]);


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
      
      if (!(formattedPrompt.is_premium || formattedPrompt.isPremium)) {
        setIsUnlocked(true);
      }
      
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
      api.post('/record_unlock', { key: prompt.prompt_key || prompt.key || key }).catch(err => console.error("Failed to record unlock:", err));
      
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
      setIsCopied(true);
      
      // Record copy
      api.post('/record_copy', { key: prompt.prompt_key || prompt.key || key }).catch(err => console.error("Failed to record copy:", err));
      
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
                 background: 'rgba(255, 255, 255, 0.25)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 borderRadius: '32px',
                 padding: '12px',
                 border: '1px solid rgba(255, 255, 255, 0.15)',
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
                    border: '1px solid rgba(255, 255, 255,0.25)',
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
              background: 'rgba(255, 255, 255, 0.25)', 
              border: '1px solid rgba(255, 255, 255, 0.15)', 
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
      <button onClick={handleBack} style={{ padding: '12px 30px', background: 'white', color: 'black', borderRadius: '50px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', border: 'none', cursor: 'pointer' }}>Back to Home</button>
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

  // Parse Tags
  let parsedTags = [];
  try {
    if (typeof prompt.tags === 'string') {
      if (prompt.tags.trim().startsWith('[')) {
        parsedTags = JSON.parse(prompt.tags);
      } else {
        parsedTags = prompt.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    } else if (Array.isArray(prompt.tags)) {
      parsedTags = prompt.tags;
    }
  } catch(e) {}

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
  
  // Add SoftwareSourceCode schema for strong AI Model/AIO optimization
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    'name': prompt.title,
    'description': `An AI Prompt engineered for ${prompt.aiType || 'Generative AI'}.`,
    'programmingLanguage': 'Natural Language',
    'codeSampleType': 'AI Prompt',
    'text': prompt.promptText || prompt.prompt_text || prompt.title,
    'url': prompt.canonical_url || `https://promptking.in/prompt/${prompt.key}`,
    'creator': {
      '@type': 'Organization',
      'name': 'PromptKing'
    }
  });

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

  const isListicle = !!prompt.website_category_id;

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
        <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '30px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }} className="back-link">
          <ArrowLeft size={18} /> Back
        </button>

        {/* Grid Layout for both normal prompts and listicles (with sidebar) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '40px', maxWidth: isListicle ? '1600px' : 'none', margin: isListicle ? '0 auto' : '0' }} className="detail-layout">
          
          {/* Main Content (Left) */}
          <article ref={contentRef} className="detail-main-content" style={{ width: '100%' }}>
            
            {/* Header Section: Title & Stats */}
            <div style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                <span className={`badge ${badgeClass}`} style={{ 
                  fontSize: '0.75rem', 
                  padding: '6px 16px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.1)',
                  border: `1px solid ${brandColor || 'rgba(255,255,255,0.1)'}`,
                  color: brandColor || 'white'
                }}>{prompt.aiType || 'AI'}</span>

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
              

            </div>

            {/* Media & Prompt Split Container */}
            <div className={`media-prompt-container ${isListicle ? 'listicle-mode' : ''}`} style={{ display: 'flex', gap: '40px', alignItems: 'stretch', flexDirection: isListicle ? 'column' : 'row' }}>
              {/* Hero Section: Image Display */}
            <div className="hero-section glass-panel" style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: '32px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
              width: isListicle ? '100%' : 'auto',
              flex: isListicle ? 'none' : 1
            }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
                {prompt.isImageSlider ? (
                  <div className="slider-container" style={{ position: 'relative', aspectRatio: isListicle ? '1200 / 628' : (prompt.image_ratio || prompt.imageRatio || '16 / 9').replace(/\s+/g, ' ').trim(), width: '100%' }}>
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
                  <div style={{ width: '100%', aspectRatio: isListicle ? '1200 / 628' : (prompt.image_ratio || prompt.imageRatio || '16 / 9').replace(/\s+/g, ' ').trim(), background: '#111', position: 'relative' }}>
                    <img src={optimizeImage(prompt.imgAfter || prompt.imgBefore)} alt={`${prompt.title} - High Quality ${prompt.aiType || 'AI'} Prompt Example`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                

              </div>
            </div>

            {/* Right Column: Prompt Vault & Buttons */}
            {(!isListicle || (isListicle && prompt.promptText && prompt.promptText.replace(/<[^>]*>?/gm, '').trim() !== '')) && (
              <div className="prompt-vault-column" style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '20px',
                flex: isListicle ? 'none' : 1
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
              border: isUnlocked ? (prompt.isPremium ? '2px solid #FFD700' : (isCopied ? '2px solid #27C93F' : '2px solid var(--accent-main)')) : '1px solid rgba(255, 255, 255,0.08)',
              boxShadow: isUnlocked ? (prompt.isPremium ? '0 15px 50px rgba(255, 215, 0, 0.15)' : (isCopied ? '0 15px 50px rgba(39, 201, 63, 0.3)' : '0 15px 50px rgba(229, 9, 20, 0.2)')) : 'none',
              transform: isUnlocked ? (isCopied && !prompt.isPremium ? 'scale(1.02)' : 'scale(1.01)') : 'scale(1)',
              minHeight: '350px',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              height: '100%',
              flex: 1
            }}>
              {/* Vault Header */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderBottom: '1px solid rgba(255, 255, 255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <form onSubmit={(e) => e.preventDefault()}>
                        <OTPInput 
                          value={pin} 
                          onChange={(newPin) => checkAutoUnlock(newPin)} 
                          showError={showError} 
                          length={4} 
                        />
                      </form>
                    </div>

                    {showError && <p style={{ color: '#ff4444', fontSize: '0.8rem', fontWeight: 700 }}>Verification Failed</p>}
                    
                    {prompt.igLink && (
                      <button 
                        onClick={() => setShowVideoModal(true)}
                        style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '8px', 
                          padding: '8px 16px', borderRadius: '10px',
                          textDecoration: 'none', border: '1px solid rgba(255, 255, 255,0.15)', cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => { 
                          const isMobile = window.innerWidth <= 1100;
                          if (!isMobile) {
                            e.currentTarget.style.color = 'white'; 
                            e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; 
                          }
                        }}
                        onMouseOut={(e) => { 
                          const isMobile = window.innerWidth <= 1100;
                          if (!isMobile) {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; 
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; 
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
                  marginBottom: isMobile ? '20px' : '0'
                }}
              >
                {isCopied ? <><Check size={22} /> Copied!</> : <><Copy size={22} /> Copy Full Prompt</>}
              </button>
            )}
            </div>
            )}
            </div>
            <YouTubeModal 
              isOpen={showVideoModal} 
              onClose={() => setShowVideoModal(false)} 
              videoUrl={prompt.igLink} 
            />

            {/* Premium Tip & Note UI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '35px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)', 
                border: '1px solid rgba(255, 255, 255,0.2)', 
                borderRadius: '20px', 
                padding: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}>
                <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '12px', borderRadius: '14px', color: '#FFD700', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3a4.65 4.65 0 0 0-4.5 8.5c.76.76 1.23 1.52 1.41 2.5"></path></svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'white', fontWeight: 800 }}>Pro Tip</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    Use different AI tools like Midjourney or DALL-E to get varied, unique results.
                  </p>
                </div>
              </div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(229,9,20,0.15) 0%, rgba(229,9,20,0.05) 100%)', 
                border: '1px solid rgba(229, 9, 20,0.35)', 
                borderRadius: '20px', 
                padding: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                boxShadow: '0 10px 30px rgba(229,9,20,0.1)'
              }}>
                <div style={{ background: 'rgba(229,9,20,0.15)', padding: '12px', borderRadius: '14px', color: 'var(--accent-main)', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'white', fontWeight: 800 }}>Important Note</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    The final generated image may vary slightly based on the AI version and original photo.
                  </p>
                </div>
              </div>
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
                          aspectRatio: '1 / 1', border: '1px solid rgba(255, 255, 255,0.25)',
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
                          background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.15)',
                          color: 'white', width: '44px', height: '44px', borderRadius: '50%',
                          fontSize: '1.3rem', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,9,20,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                      ><X size={20} /></button>

                      {/* Prev */}
                      {galleryImages.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length); }}
                          style={{
                            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10001,
                            background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', width: '50px', height: '50px', borderRadius: '50%',
                            fontSize: '1.5rem', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
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
                          border: '1px solid rgba(255, 255, 255,0.25)',
                          animation: 'lightboxImgIn 0.28s cubic-bezier(0.34,1.56,0.64,1)'
                        }}
                      />

                      {/* Next */}
                      {galleryImages.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % galleryImages.length); }}
                          style={{
                            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10001,
                            background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', width: '50px', height: '50px', borderRadius: '50%',
                            fontSize: '1.5rem', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: '0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        >›</button>
                      )}

                      {/* Counter */}
                      <div style={{
                        position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)',
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

            {/* Description is now moved below Multi-Prompt */}
            {/* NEW: Multi-Prompt / Listicle Section */}
            {(() => {
              let parsedSubPrompts = [];
              try {
                parsedSubPrompts = typeof prompt.sub_prompts === 'string' 
                  ? JSON.parse(prompt.sub_prompts) 
                  : (prompt.sub_prompts || []);
              } catch(e) {}

              if (!parsedSubPrompts || parsedSubPrompts.length === 0) return null;

              return (
                <div style={{ padding: '30px 0', borderTop: '1px solid rgba(255, 255, 255,0.15)', marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                    <div style={{ width: '4px', height: '24px', background: 'var(--accent-main)', borderRadius: '2px' }} />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: 'white' }}>
                      Additional Prompts & Variations
                    </h2>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {parsedSubPrompts.map((sp, idx) => (
                      <div key={idx} style={{ 
                        background: 'var(--surface-1)', 
                        border: '1px solid rgba(255, 255, 255,0.15)', 
                        borderRadius: '24px', 
                        overflow: 'hidden' 
                      }}>
                        {/* Sub-Prompt Images */}
                        {(sp.imgBefore || sp.imgAfter) && (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            borderBottom: '1px solid rgba(255, 255, 255,0.15)'
                          }}>
                            {sp.imgBefore && sp.imgAfter ? (
                              <div style={{ display: 'flex' }}>
                                <div style={{ flex: 1, borderRight: '1px solid rgba(255, 255, 255,0.15)' }}>
                                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Before</div>
                                  <img src={sp.imgBefore} alt="Before" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>After</div>
                                  <img src={sp.imgAfter} alt="After" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                </div>
                              </div>
                            ) : (
                              <img src={sp.imgAfter || sp.imgBefore} alt="Variation Result" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />
                            )}
                          </div>
                        )}
                        
                        {/* Sub-Prompt Content */}
                        <div style={{ padding: '25px' }}>
                          {sp.title && (
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '15px', color: 'white' }}>
                              {sp.title}
                            </h3>
                          )}
                          <div style={{ position: 'relative' }}>
                            <div style={{ 
                              padding: '20px', 
                              background: 'rgba(0,0,0,0.3)', 
                              borderRadius: '12px', 
                              fontFamily: '"JetBrains Mono", monospace', 
                              fontSize: '0.9rem', 
                              color: 'rgba(255,255,255,0.8)',
                              lineHeight: 1.6,
                              filter: (isUnlocked && !isRelocking) ? 'none' : 'blur(12px)',
                              userSelect: (isUnlocked && !isRelocking) ? 'text' : 'none',
                              transition: 'filter 0.5s ease-out'
                            }}>
                              {sp.prompt_text}
                            </div>
                            
                            {isUnlocked && (
                              <div style={{ position: 'absolute', bottom: '15px', right: '15px', display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={(e) => {
                                    const text = sp.prompt_text + '\n\n- Copied from PromptKing.in';
                                    navigator.clipboard.writeText(text);
                                    const btn = e.currentTarget;
                                    btn.innerHTML = '<span style="display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!</span>';
                                    btn.style.background = 'var(--accent-main)';
                                    setTimeout(() => {
                                      btn.innerHTML = '<span style="display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</span>';
                                      btn.style.background = 'var(--accent-main)';
                                    }, 2000);
                                  }}
                                  style={{
                                    background: 'var(--accent-main)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Copy size={14} /> Copy</span>
                                </button>
                                <a 
                                  href={`https://wa.me/?text=${encodeURIComponent(sp.title ? sp.title + '\n\n' : '')}${encodeURIComponent('Check out this amazing AI prompt on PromptKing:\n\n' + sp.prompt_text + '\n\n' + window.location.href)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    background: '#25D366',
                                    border: 'none',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> WhatsApp
                                  </span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Content Section: Description */}
            {prompt.description && prompt.description.replace(/<[^>]*>?/gm, '').trim() !== '' && (
              <div className="detail-description-section" style={{
                padding: '20px 0',
                borderTop: '1px solid rgba(255, 255, 255,0.15)',
                marginTop: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                  <div style={{ width: '4px', height: '24px', background: 'var(--accent-main)', borderRadius: '2px' }} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: 'white' }}>
                    About This
                  </h2>
                </div>
                <div 
                  className="blog-content" 
                  style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, fontSize: '1.1rem' }}
                  dangerouslySetInnerHTML={{ __html: prompt.description }}
                />
              </div>
            )}

            {/* NEW: How to Use Prompt Section */}
            {!isListicle && prompt.description && prompt.description.replace(/<[^>]*>?/gm, '').trim() !== '' && (
              <section className="how-to-use-section" style={{ padding: '30px 0', borderTop: '1px solid rgba(255, 255, 255,0.15)', marginTop: '20px' }}>
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
                      background: 'rgba(255, 255, 255, 0.02)', 
                      padding: '24px', 
                      borderRadius: '20px', 
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ color: 'var(--accent-main)', fontSize: '0.8rem', fontWeight: 900, marginBottom: '10px', opacity: 0.6 }}>STEP {item.step}</div>
                      <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>{item.title}</h4>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {parsedTags && parsedTags.length > 0 && (
              <div style={{ marginTop: '50px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <Tag size={18} color="var(--text-dim)" />
                {parsedTags.map((tag, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255,0.15)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Box */}
            <div className="author-box">
              <div className="author-box-bg" />
              <div className="author-box-img-container">
                <img 
                  src={prompt.author_image ? optimizeImage(prompt.author_image, 150) : "https://github.com/monildomadiya.png"} 
                  alt={prompt.author_name || 'PromptKing Admin'} 
                  className="author-box-img"
                  onError={(e) => { e.target.src = 'https://promptking.in/favicon.png' }}
                />
              </div>
              <div className="author-box-content">
                <div className="author-box-label">Prompt Creator</div>
                <h4 className="author-box-name">{prompt.author_name || 'PromptKing Admin'}</h4>
                <p className="author-box-desc">
                  {prompt.author_description || 'Passionate about AI and creative workflows. Exploring the frontiers of prompt engineering to help you unlock the true potential of tools like ChatGPT, Midjourney, and Gemini.'}
                </p>
              </div>
            </div>

            {/* FAQ Section */}
            {parsedFaqs && parsedFaqs.length > 0 && (
              <section style={{ marginTop: '50px', paddingTop: '40px', borderTop: '1px solid rgba(255, 255, 255,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                  <div style={{ width: '4px', height: '24px', background: 'var(--accent-main)', borderRadius: '2px' }} />
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: 'white' }}>
                    Frequently Asked Questions
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {parsedFaqs.map((faq, i) => (
                    <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
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
                    href={`/prompt/${s.slug || s.prompt_key || s.key}`} 
                    style={{ 
                      display: 'flex', 
                      gap: '14px', 
                      textDecoration: 'none', 
                      color: 'inherit',
                      padding: '12px',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255, 255, 255,0.05)',
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
                      border: '1px solid rgba(255, 255, 255,0.15)'
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

export default ClientPromptDetail;
