"use client";
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

import PromptList from '@/components/Prompts/PromptList';
import SEOMetadata from '@/components/SEO/SEOMetadata';
import { Search, X, Crown, Coffee, CheckCircle } from '@/components/Common/Icons';

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
    return "PromptKing – Best AI Prompts for ChatGPT, Gemini & Midjourney";
  };

  const getPageDescription = () => {
    if (categorySlug) {
      const formattedCategory = categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return `Explore our curated collection of high-quality ${formattedCategory} prompts. Copy and use these free AI prompts instantly to improve your workflow.`;
    }
    return "Explore 1000+ free AI prompts for ChatGPT, Gemini, and Midjourney. Copy ready-to-use prompts for writing, coding, design, and more — all in one place.";
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
      <div style={{ position: 'relative', textAlign: 'center', marginTop: '70px', padding: '0 20px', zIndex: 10 }}>
        {/* Subtle glowing background behind title */}
        {!categorySlug && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '100%', maxWidth: '800px', height: '100%', minHeight: '150px', 
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 70%)',
            zIndex: -1, pointerEvents: 'none', filter: 'blur(30px)'
          }}></div>
        )}

        <h1 className="home-hero-title">
          {categorySlug ? `${categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} AI Prompts` : 'The Best AI Prompts for ChatGPT, Gemini & Midjourney'}
        </h1>
        {!categorySlug && (
          <p className="home-hero-subtitle">
            Copy-paste ready prompts for writers, creators, students, and professionals. Save hours — just pick a prompt and go.
          </p>
        )}
      </div>

      <div style={{
        maxWidth: '1000px', margin: '40px auto 40px', padding: '0 20px',
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

      {!categorySlug && (
        <div style={{
          maxWidth: '1000px',
          margin: '80px auto',
          padding: '40px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.8,
          fontSize: '1.05rem'
        }}>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '20px', fontWeight: 700, lineHeight: 1.2 }}>What is PromptKing?</h2>
          <p style={{ marginBottom: '20px' }}>
            PromptKing is a free AI prompt library designed for anyone who uses ChatGPT, Google Gemini, or Midjourney. Whether you're a student, marketer, developer, or creative professional — we have prompts that save you time and deliver better results.
          </p>
          <p style={{ marginBottom: '20px' }}>
            Our library is organized by category and use case, so you can find the right prompt in seconds — no guesswork needed.
          </p>
          <ul style={{ listStyleType: 'none', padding: 0, marginBottom: '40px' }}>
            <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} color="#4CAF50" /> 1000+ ready-to-use prompts</li>
            <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} color="#4CAF50" /> Works with ChatGPT, Gemini, Claude & Midjourney</li>
            <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} color="#4CAF50" /> Free to use — no sign-up required</li>
            <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} color="#4CAF50" /> New prompts added every week</li>
          </ul>

          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '20px', fontWeight: 700, lineHeight: 1.2 }}>Why Use PromptKing?</h2>
          <p style={{ marginBottom: '20px' }}>
            Most people spend 20–30 minutes crafting a single AI prompt — only to get mediocre results. PromptKing solves that.
          </p>
          <p style={{ marginBottom: '20px' }}>
            We've tested and curated prompts that actually work. Each prompt is:
            <br />→ Specific enough to get high-quality output
            <br />→ Written by AI enthusiasts who use these tools daily
            <br />→ Organized so you can find what you need fast
          </p>
          <p style={{ marginBottom: '40px' }}>
            Whether you're generating images in Midjourney, writing content with ChatGPT, or doing research with Gemini — PromptKing helps you get better results, faster.
          </p>

          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '20px', fontWeight: 700, lineHeight: 1.2 }}>The Ultimate AI Prompt Library</h2>
          <p style={{ marginBottom: '20px' }}>
            Looking for the best ChatGPT prompts? Want Midjourney prompts that create stunning images? Need Gemini prompts for research and writing? You've come to the right place.
          </p>
          <p style={{ marginBottom: '20px' }}>
            PromptKing is one of India's fastest-growing AI prompt libraries, trusted by students, content creators, marketers, and developers who want to get the most out of AI tools.
          </p>
          <p style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#fff' }}>ChatGPT Prompts:</strong> From writing essays to generating business ideas, our ChatGPT prompt collection helps you unlock the full power of GPT-4 and ChatGPT-4o.
          </p>
          <p style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#fff' }}>Midjourney Prompts:</strong> Create breathtaking AI art with our hand-picked Midjourney prompt templates — covering portrait photography, anime, logo design, and more.
          </p>
          <p style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#fff' }}>Gemini Prompts:</strong> Use Google Gemini to its full potential with our curated Gemini prompt collection for summarization, research, coding, and creative tasks.
          </p>
          <p>
            Bookmark PromptKing — your go-to destination for free, high-quality AI prompts.
          </p>
        </div>
      )}
    </main>
  );
};

export default HomePage;
