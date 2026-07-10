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

      {/* Banner Ad Placement */}
      {settings?.adsense_enabled === '1' && settings?.adsense_slot_header && (
        <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '0 20px', width: '100%' }}>
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
        <section style={{ maxWidth: '1200px', margin: '80px auto 60px', padding: '0 20px' }}>
          <style>{`
            @keyframes pkFloatOrb {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-14px); }
            }
            .pk-feat-card {
              background: rgba(255,255,255,0.025);
              border: 1px solid rgba(255,255,255,0.07);
              border-radius: 20px;
              padding: 26px 24px;
              display: flex;
              align-items: flex-start;
              gap: 18px;
              transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
              position: relative;
              overflow: hidden;
            }
            .pk-feat-card::after {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: 20px;
              background: radial-gradient(ellipse at 0% 0%, rgba(229,9,20,0.07) 0%, transparent 60%);
              opacity: 0;
              transition: opacity 0.3s ease;
            }
            .pk-feat-card:hover {
              border-color: rgba(229,9,20,0.35);
              transform: translateY(-3px);
              box-shadow: 0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(229,9,20,0.12);
            }
            .pk-feat-card:hover::after { opacity: 1; }
            .pk-icon-box {
              width: 46px;
              height: 46px;
              border-radius: 13px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              position: relative;
              z-index: 1;
            }
            .pk-stat-box {
              flex: 1;
              min-width: 130px;
              background: rgba(255,255,255,0.025);
              border: 1px solid rgba(255,255,255,0.07);
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
              background: rgba(255,255,255,0.04);
              border: 1px solid rgba(255,255,255,0.09);
              font-size: 0.82rem;
              font-weight: 700;
              color: rgba(255,255,255,0.7);
              transition: all 0.22s ease;
            }
            .pk-ai-pill:hover {
              background: rgba(255,255,255,0.09);
              border-color: rgba(255,255,255,0.2);
              color: #fff;
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
              color: '#ffffff',
            }}>
              Built for serious AI users
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Every feature is designed to save your time and get you better results from every AI tool.
            </p>
          </div>

          {/* ─── Feature Cards ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px', marginBottom: '36px' }}>
            {[
              {
                Icon: Copy,
                color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)',
                title: 'One-Click Copy',
                desc: 'Instantly copy any prompt to your clipboard with a single tap. Paste straight into ChatGPT, Gemini, or Midjourney.',
              },
              {
                Icon: Image,
                color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)',
                title: 'Before/After Slider',
                desc: 'See exactly what each prompt produces. Our interactive image slider lets you compare the original and AI result side by side.',
              },
              {
                Icon: Crown,
                color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)',
                title: 'Premium Prompts',
                desc: 'Unlock exclusive expert-level prompts with a PIN. Premium prompts are engineered for maximum output quality.',
              },
              {
                Icon: FileText,
                color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)',
                title: 'Blog & Tutorials',
                desc: 'Learn prompt engineering from our in-depth blog. Guides, tips, and tutorials to master ChatGPT, Gemini, and Midjourney.',
              },
              {
                Icon: HelpCircle,
                color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)',
                title: 'FAQ on Every Prompt',
                desc: 'Each prompt page includes a detailed FAQ — so you understand how, why, and where to use it for best results.',
              },
              {
                Icon: Filter,
                color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)',
                title: 'Search & Filter',
                desc: 'Search 1,000+ prompts by keyword or filter by AI tool and category. Find your perfect prompt in under 10 seconds.',
              },
              {
                Icon: Lock,
                color: '#e50914', bg: 'rgba(229,9,20,0.1)', border: 'rgba(229,9,20,0.2)',
                title: 'Secure PIN Unlock',
                desc: 'Premium prompt access is protected with a secure PIN system — so your exclusive content stays safe.',
              },
              {
                Icon: Shield,
                color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)',
                title: 'No Sign-Up Required',
                desc: 'Browse and copy all free prompts without creating an account. Zero friction, full access, instant results.',
              },
            ].map(({ Icon, color, bg, border, title, desc }) => (
              <div key={title} className="pk-feat-card">
                <div className="pk-icon-box" style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{title}</h3>
                  <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ─── CTA Strip ─── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(229,9,20,0.11) 0%, rgba(229,9,20,0.03) 100%)',
            border: '1px solid rgba(229,9,20,0.18)', borderRadius: '22px',
            padding: '32px 36px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px',
          }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '5px' }}>Ready to get better AI results?</h3>
              <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.88rem', margin: 0 }}>Browse 1,000+ free prompts — no account needed.</p>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '13px 28px', background: 'var(--accent-gradient)',
                color: '#fff', border: 'none', borderRadius: '50px',
                fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(229,9,20,0.32)', transition: 'all 0.22s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(229,9,20,0.48)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(229,9,20,0.32)'; }}
            >
              Explore Prompts <ArrowRight size={16} />
            </button>
          </div>

        </section>
      )}
    </main>
  );
};

export default HomePage;
