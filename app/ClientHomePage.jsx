"use client";
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

import PromptList from '@/components/Prompts/PromptList';
import SEOMetadata from '@/components/SEO/SEOMetadata';
import { Search, X, Crown, Coffee, Copy, Image, FileText, HelpCircle, Lock, Filter, Shield, ArrowRight } from '@/components/Common/Icons';
import AdSenseUnit from '@/components/Ads/AdSenseUnit';

import { useAppContext } from '@/components/AppContext';

const HomePage = ({ initialPrompts = [], initialCategories = [], initialWebsiteCategories = [] }) => {
  const { search, setSearch, filter, setFilter, isMobile, settings } = useAppContext();
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
            background: 'radial-gradient(ellipse at center, rgba(229,9,20,0.06) 0%, rgba(255,255,255,0) 70%)',
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
                  background: 'rgba(0,0,0,0.08)',
                  borderRadius: '50%'
                }}
              >
                <X size={16} style={{ color: 'var(--text-secondary)' }} />
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
                background: filter === 'premium' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#f8fafc',
                border: filter === 'premium' ? '1px solid #0f172a' : '1px solid rgba(15, 23, 42, 0.12)',
                color: filter === 'premium' ? '#ffffff' : '#0f172a',
                boxShadow: filter === 'premium' ? '0 8px 20px rgba(15, 23, 42, 0.25)' : 'none'
              }}
            >
              <Crown 
                size={17} 
                fill={filter === 'premium' ? '#f59e0b' : 'rgba(245, 158, 11, 0.18)'} 
                style={{ 
                  display: 'block', 
                  color: filter === 'premium' ? '#ffb703' : '#d97706',
                  filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.35))',
                  transition: 'all 0.25s ease'
                }} 
              />
              Premium
            </button>

            <a 
              href="https://ko-fi.com/M5H720SAJV"
              target="_blank"
              rel="noopener noreferrer"
              className="coffee-btn-hover home-search-btn-coffee"
            >
              <Coffee size={17} style={{ display: 'block' }} />
              Support Us
            </a>
          </div>
        </div>
      </div>

      {/* Banner Ad Placement — no vertical margin on the wrapper so its late
          appearance (after client settings load) doesn't shift the grid; the
          ad unit adds its own spacing only once an ad actually fills. */}
      {settings?.adsense_enabled === '1' && settings?.adsense_slot_header && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', width: '100%' }}>
          <AdSenseUnit client={settings.adsense_client_id} slot={settings.adsense_slot_header} />
        </div>
      )}

      <PromptList 
        search={search} 
        filter={filter} 
        setFilter={setFilter} 
        isMobile={isMobile}
        initialPrompts={initialPrompts}
        initialCategories={initialCategories}
        settings={settings}
      />

      {!categorySlug && (
        <section style={{ maxWidth: '1400px', width: '100%', margin: '80px auto 60px', padding: isMobile ? '0 10px' : '0 20px' }}>
          <style>{`
            @keyframes pkFloatOrb {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-14px); }
            }
            .pk-feat-card {
              background: #f8fafc;
              border: 1px solid rgba(15, 23, 42, 0.08);
              border-radius: 20px;
              padding: 28px 24px;
              display: flex;
              align-items: flex-start;
              gap: 18px;
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
              position: relative;
              box-shadow: 0 4px 18px rgba(15, 23, 42, 0.03);
            }
            .pk-feat-card:hover {
              background: #ffffff;
              border-color: rgba(229, 9, 20, 0.35);
              transform: translateY(-5px);
              box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(229, 9, 20, 0.12);
            }
            .pk-icon-box {
              width: 48px;
              height: 48px;
              border-radius: 14px;
              background: rgba(229, 9, 20, 0.06);
              border: 1px solid rgba(229, 9, 20, 0.18);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              color: #e50914;
              box-shadow: 0 4px 14px rgba(229, 9, 20, 0.04);
              transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s, border-color 0.3s;
            }
            .pk-feat-card:hover .pk-icon-box {
              transform: scale(1.08) rotate(4deg);
              background: rgba(229, 9, 20, 0.12);
              border-color: rgba(229, 9, 20, 0.4);
              box-shadow: 0 6px 18px rgba(229, 9, 20, 0.15);
            }
            .pk-stat-box {
              flex: 1;
              min-width: 130px;
              background: #ffffff;
              border: 1px solid rgba(0,0,0,0.08);
              border-radius: 18px;
              padding: 24px 16px;
              text-align: center;
              transition: border-color 0.3s, background 0.3s;
            }
            .pk-stat-box:hover {
              border-color: rgba(229,9,20,0.3);
              background: rgba(229,9,20,0.04);
            }
            .pk-ai-pill {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              padding: 9px 16px;
              border-radius: 50px;
              background: rgba(0,0,0,0.04);
              border: 1px solid rgba(0,0,0,0.1);
              font-size: 0.82rem;
              font-weight: 700;
              color: rgba(20,22,26,0.7);
              transition: all 0.22s ease;
            }
            .pk-ai-pill:hover {
              background: rgba(0,0,0,0.07);
              border-color: rgba(0,0,0,0.2);
              color: var(--text-main);
              transform: translateY(-2px);
            }
          `}</style>

          {/* ─── Header ─── */}
          <div style={{ textAlign: 'center', marginBottom: '56px', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: '480px', height: '180px', pointerEvents: 'none',
              background: 'radial-gradient(ellipse, rgba(229,9,20,0.09) 0%, transparent 70%)',
              filter: 'blur(24px)',
            }} />
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '50px', marginBottom: '18px',
              background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.22)',
              fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-main)',
              textTransform: 'uppercase', letterSpacing: '2px',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-main)', display: 'inline-block', boxShadow: '0 0 6px var(--accent-main)' }} />
              Everything you get
            </div>
            <h2 style={{
              fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', fontWeight: 900,
              letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '14px',
              color: 'var(--text-main)',
            }}>
              Built for serious AI users
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Every feature is designed to save your time and get you better results from every AI tool.
            </p>
          </div>

          {/* ─── Feature Cards ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px', marginBottom: '36px' }}>
            {[
              {
                Icon: Copy,
                color: '#e50914', bg: 'rgba(229,9,20,0.09)', border: 'rgba(229,9,20,0.22)',
                title: 'One-Click Copy',
                desc: 'Instantly copy any prompt to your clipboard with a single tap. Paste straight into ChatGPT, Gemini, or Midjourney.',
              },
              {
                Icon: Image,
                color: '#d97706', bg: 'rgba(217,119,6,0.09)', border: 'rgba(217,119,6,0.22)',
                title: 'Before/After Slider',
                desc: 'See exactly what each prompt produces. Our interactive image slider lets you compare the original and AI result side by side.',
              },
              {
                Icon: Crown,
                color: '#e50914', bg: 'rgba(229,9,20,0.09)', border: 'rgba(229,9,20,0.22)',
                title: 'Premium Prompts',
                desc: 'Unlock exclusive expert-level prompts with a PIN. Premium prompts are engineered for maximum output quality.',
              },
              {
                Icon: FileText,
                color: '#d97706', bg: 'rgba(217,119,6,0.09)', border: 'rgba(217,119,6,0.22)',
                title: 'Blog & Tutorials',
                desc: 'Learn prompt engineering from our in-depth blog. Guides, tips, and tutorials to master ChatGPT, Gemini, and Midjourney.',
              },
              {
                Icon: HelpCircle,
                color: '#e50914', bg: 'rgba(229,9,20,0.09)', border: 'rgba(229,9,20,0.22)',
                title: 'FAQ on Every Prompt',
                desc: 'Each prompt page includes a detailed FAQ — so you understand how, why, and where to use it for best results.',
              },
              {
                Icon: Filter,
                color: '#d97706', bg: 'rgba(217,119,6,0.09)', border: 'rgba(217,119,6,0.22)',
                title: 'Search & Filter',
                desc: 'Search 1,000+ prompts by keyword or filter by AI tool and category. Find your perfect prompt in under 10 seconds.',
              },
              {
                Icon: Lock,
                color: '#e50914', bg: 'rgba(229,9,20,0.09)', border: 'rgba(229,9,20,0.22)',
                title: 'Secure PIN Unlock',
                desc: 'Premium prompt access is protected with a secure PIN system — so your exclusive content stays safe.',
              },
              {
                Icon: Shield,
                color: '#d97706', bg: 'rgba(217,119,6,0.09)', border: 'rgba(217,119,6,0.22)',
                title: 'No Sign-Up Required',
                desc: 'Browse and copy all free prompts without creating an account. Zero friction, full access, instant results.',
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="pk-feat-card">
                <div className="pk-icon-box">
                  <Icon size={21} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.68, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default HomePage;
