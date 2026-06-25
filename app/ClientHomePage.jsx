"use client";
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

import PromptList from '@/components/Prompts/PromptList';
import SEOMetadata from '@/components/SEO/SEOMetadata';
import { Search, X, Crown, Coffee } from '@/components/Common/Icons';

import { useAppContext } from '@/components/AppContext';

const HomePage = ({ initialPrompts = [], initialCategories = [], initialWebsiteCategories = [] }) => {
  const { search, setSearch, filter, setFilter, isMobile } = useAppContext();
  const { categorySlug } = useParams();

  useEffect(() => {
    if (categorySlug) {
      setFilter(categorySlug.toLowerCase());
    }
  }, [categorySlug, setFilter]);

  const getPageTitle = () => {
    if (categorySlug) {
      const formattedCategory = categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return `${formattedCategory} Prompts - Free AI Library | PromptKing`;
    }
    return "PromptKing – Free AI Prompts for ChatGPT, Gemini, Midjourney & More";
  };

  const getPageDescription = () => {
    if (categorySlug) {
      const formattedCategory = categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return `Explore our curated collection of high-quality ${formattedCategory} prompts. Copy and use these free AI prompts instantly to improve your workflow.`;
    }
    return "Discover 1000+ free AI prompts for ChatGPT, Gemini, Midjourney, DALL·E & Stable Diffusion. Copy expert-crafted prompts for image creation, writing & more. Updated daily.";
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PromptKing",
    "url": "https://promptking.in/",
    "description": "Unlock the full potential of AI with PromptKing. Discover premium & free prompts for ChatGPT, Midjourney, Gemini and more.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://promptking.in/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <main>
      <SEOMetadata 
        title={getPageTitle()}
        description={getPageDescription()}
        url={`https://promptking.in${categorySlug ? `/category/${categorySlug}` : '/'}`}
        schema={schema}
      />
      <h1 style={{ 
        position: 'absolute', 
        width: '1px', 
        height: '1px', 
        padding: 0, 
        margin: '-1px', 
        overflow: 'hidden', 
        clip: 'rect(0,0,0,0)', 
        border: 0 
      }}>
        {categorySlug ? `${categorySlug.split('-').join(' ')} AI Prompts Library` : 'PromptKing - Premium AI Prompts Library for ChatGPT, Midjourney & Gemini'}
      </h1>

      <div style={{
        maxWidth: '1000px', margin: '60px auto 40px', padding: '0 20px',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: isMobile ? '15px' : '10px 10px 10px 25px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '15px' : '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center',
            flex: 1,
            width: '100%'
          }}>
            <Search 
              size={22} 
              style={{ 
                position: 'absolute', 
                left: isMobile ? '15px' : '0', 
                color: 'var(--text-secondary)',
                opacity: 0.8
              }} 
            />
            <input 
              type="text" 
              placeholder="Search thousands of prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', 
                padding: isMobile ? '15px 20px 15px 50px' : '15px 20px 15px 40px', 
                borderRadius: isMobile ? '16px' : '0',
                fontSize: '1.1rem',
                border: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
                background: isMobile ? 'rgba(0,0,0,0.2)' : 'transparent',
                color: 'white',
                outline: 'none'
              }} 
            />
            {search && (
              <div 
                onPointerDown={(e) => {
                  e.preventDefault(); 
                  setSearch('');
                }}
                style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }}
              >
                <X size={16} style={{ color: 'white' }} />
              </div>
            )}
          </div>

          {!isMobile && <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>}

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            width: isMobile ? '100%' : 'auto' 
          }}>
            <button 
              onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
              className="pro-card-hover"
              title="Premium Prompts"
              style={{ 
                height: '50px', borderRadius: '16px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                background: filter === 'premium' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.03)',
                border: filter === 'premium' ? '1px solid rgba(255, 193, 7, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: filter === 'premium' ? '#FFC107' : 'rgba(255,255,255,0.8)',
                transition: 'all 0.3s ease',
                flex: isMobile ? 1 : 'initial',
                padding: isMobile ? '0 15px' : '0 25px',
                fontSize: '0.95rem',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              <Crown size={18} fill={filter === 'premium' ? '#FFC107' : 'none'} style={{ display: 'block' }} />
              Premium
            </button>

            <a 
              href="https://ko-fi.com/M5H720SAJV"
              target="_blank"
              rel="noopener noreferrer"
              className="coffee-btn-hover"
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                height: '50px', borderRadius: '16px', 
                padding: isMobile ? '0 15px' : '0 25px',
                cursor: 'pointer',
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.2)',
                color: '#FFC107',
                transition: 'all 0.3s ease',
                flex: isMobile ? 1 : 'initial',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              <Coffee size={18} style={{ display: 'block' }} />
              Support Us
            </a>
          </div>
        </div>
      </div>

      <PromptList 
        search={search} 
        filter={filter} 
        setFilter={setFilter} 
        isMobile={isMobile}
        initialPrompts={initialPrompts}
        initialCategories={initialCategories}
      />
    </main>
  );
};

export default HomePage;
