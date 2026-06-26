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
        <div className="home-search-wrapper">
          <div className="home-search-input-container">
            <Search 
              size={22} 
              className="home-search-icon" 
            />
            <input 
              type="text" 
              placeholder="Search thousands of prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="home-search-input" 
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

          <div className="home-search-divider"></div>

          <div className="home-search-buttons-group">
            <button 
              onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
              className="pro-card-hover home-search-btn-pro"
              title="Premium Prompts"
              style={{ 
                background: filter === 'premium' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.03)',
                border: filter === 'premium' ? '1px solid rgba(255, 193, 7, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: filter === 'premium' ? '#FFC107' : 'rgba(255,255,255,0.8)'
              }}
            >
              <Crown size={18} fill={filter === 'premium' ? '#FFC107' : 'none'} style={{ display: 'block' }} />
              Premium
            </button>

            <a 
              href="https://ko-fi.com/M5H720SAJV"
              target="_blank"
              rel="noopener noreferrer"
              className="coffee-btn-hover home-search-btn-coffee"
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
