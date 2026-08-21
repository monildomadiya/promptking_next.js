"use client";
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import PromptList from '@/components/Prompts/PromptList';
import WallpaperCategories from '@/components/Wallpapers/WallpaperCategories';
import SEOMetadata from '@/components/SEO/SEOMetadata';
import { Search, X, Crown, Coffee, Copy, Image, FileText, HelpCircle, Lock, Filter, Shield, ArrowRight } from '@/components/Common/Icons';


import { useAppContext } from '@/components/AppContext';

// The pages worth being found as a section of the site. Google builds sitelinks
// out of pages it can see are important, and importance is judged largely from
// internal links: their anchor text, and how prominently they are placed. The
// homepage previously linked these only from the footer, and the category pages
// not at all — the header's Explore menu only put them in the DOM on hover, and
// a crawler never hovers.
const SITE_SECTIONS = [
  { href: '/categories', label: 'Categories', blurb: 'Every prompt collection, grouped by topic and AI tool.' },
  { href: '/wallpapers', label: 'Wallpapers', blurb: 'Free AI wallpapers for phone and desktop, no sign-up.' },
  { href: '/games', label: 'Games', blurb: 'Guess the prompt, battle the best images, spin for a free unlock.' },
  { href: '/blog', label: 'Blog', blurb: 'Prompt engineering guides, tips and tutorials.' },
  { href: '/faq', label: 'FAQ', blurb: 'How prompts, premium unlocks and copying work.' },
  { href: '/about', label: 'About', blurb: 'Who builds and tests these prompts.' },
  { href: '/contact', label: 'Contact', blurb: 'Request a prompt or report a problem.' },
];

// Inline rather than a class: the stylesheet these would otherwise borrow from
// lives inside a conditionally rendered <style> block further down the page.
const categoryPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '9px 16px',
  borderRadius: '50px',
  background: 'rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.1)',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: 'rgba(20,22,26,0.7)',
  textDecoration: 'none',
};

const HomePage = ({ initialPrompts = [], initialCategories = [], initialWebsiteCategories = [], initialWallpaperCategories = [] }) => {
  const { search, setSearch, filter, setFilter, isMobile, settings } = useAppContext();
  const { categorySlug } = useParams();

  // While a search is running the page strips down to header + results + footer.
  // The hero and the marketing section otherwise push the one prompt the user
  // asked for below the fold — which is exactly what a screen recording shows.
  const isSearching = !!search.trim();

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
    return "Explore 100+ free AI prompts for ChatGPT, Gemini, and Midjourney. Copy ready-to-use prompts for writing, coding, design, and more — all in one place.";
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
    // flow-root so the first section's top margin stays inside main instead of
    // collapsing out through it. The layout wrapper above has a flat padding-top
    // sized for the fixed header, which leaves almost nothing under the tall
    // desktop one — and an escaped margin cannot add the air back.
    <main style={{ display: 'flow-root' }}>
      <SEOMetadata 
        title={getPageTitle()}
        description={getPageDescription()}
        url={`https://promptking.in${categorySlug ? `/category/${categorySlug}` : '/'}`}
        schema={schema}
      />

      {/* Category links, server-rendered from the same data the page already
          fetched. The band is conditional on having any: it used to hold the
          page heading as well, and with that gone an empty wrapper would leave
          80px of margin above the wallpapers and nothing inside it. */}
      {!isSearching && initialWebsiteCategories.length > 0 && (
      <div style={{
        maxWidth: 'var(--container-max)', margin: '40px auto 40px', padding: isMobile ? '0 28px' : '0 20px',
      }}>
        <nav aria-label="Prompt categories" style={{
          display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center',
        }}>
          {initialWebsiteCategories.map((cat) => (
            <Link key={cat.slug || cat.id} href={`/category/${cat.slug}`} style={categoryPillStyle}>
              {cat.name}
            </Link>
          ))}
          <Link href="/categories" style={{ ...categoryPillStyle, color: 'var(--accent-main)', borderColor: 'rgba(229,9,20,0.25)' }}>
            All categories →
          </Link>
        </nav>
      </div>
      )}

      {/* Above the prompt grid on purpose: this is the one section of the site
          a visitor has no reason to guess exists, and the images explain it
          faster than a nav link can. Hidden while searching — someone typing a
          query is not browsing. */}
      {!isSearching && <WallpaperCategories categories={initialWallpaperCategories} />}

      <PromptList
        search={search} 
        filter={filter} 
        setFilter={setFilter} 
        isMobile={isMobile}
        initialPrompts={initialPrompts}
        initialCategories={initialCategories}
        settings={settings}
      />

      {/* Descriptive links to the handful of pages that are actually sections of
          the site. Both the anchor text and the position matter: this is the
          shortlist Google picks sitelinks from. */}
      {!isSearching && (
        <nav aria-label="Browse PromptKing" style={{
          maxWidth: 'var(--container-max)', width: '100%', margin: '56px auto 0',
          padding: isMobile ? '0 28px' : '0 20px',
        }}>
          <h2 style={{
            fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.3px',
            color: 'var(--text-main)', margin: '0 0 16px',
          }}>
            Explore PromptKing
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px',
          }}>
            {SITE_SECTIONS.map(({ href, label, blurb }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'block',
                  padding: '16px 18px',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  border: '1px solid rgba(15,23,42,0.08)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {label}
                </span>
                <span style={{ display: 'block', fontSize: '0.82rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                  {blurb}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {!categorySlug && !isSearching && (
        <section style={{ maxWidth: 'var(--container-max)', width: '100%', margin: '80px auto 60px', padding: isMobile ? '0 28px' : '0 20px' }}>
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
          {/* overflow:hidden because the glow below is a fixed 480px wide and
              was pushing the page 53px past the viewport on a 375px phone —
              pointer-events:none stops it catching taps, not scroll width. */}
          <div style={{ textAlign: 'center', marginBottom: '56px', position: 'relative', overflow: 'hidden' }}>
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
                desc: 'Search the full prompt library by keyword or filter by AI tool and category. Find your perfect prompt in under 10 seconds.',
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
