import React from 'react';
import db from '@/lib/db';
import Link from 'next/link';
import PromptCard from '@/components/Prompts/PromptCard';

const parseDbBool = (val) => {
  if (val === null || val === undefined) return false;
  if (Buffer.isBuffer(val)) return val[0] === 1;
  return val == 1 || val === true || val === 'true';
};

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  let category = null;
  try {
    const cats = await db`SELECT * FROM website_categories WHERE slug = ${slug}`;
    if (cats.length > 0) category = cats[0];
  } catch (err) {}

  if (!category) {
    return { title: 'Category Not Found - PromptKing' };
  }

  const title = category.meta_title || `${category.name} Prompts - PromptKing`;
  const description = category.meta_description || category.description || `Explore our curated collection of ${category.name} AI prompts.`;
  const canonicalUrl = `https://promptking.in/category/${category.slug}`;

  let image = category.image_url || 'https://promptking.in/og-image.jpg';
  if (image.startsWith('/')) image = `https://promptking.in${image}`;
  else if (!image.startsWith('http')) image = `https://promptking.in/${image}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    }
  };
}

export default async function CategoryPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  let category = null;
  let prompts = [];

  try {
    const cats = await db`SELECT * FROM website_categories WHERE slug = ${slug}`;
    if (cats.length > 0) {
      category = cats[0];
      const rows = await db`SELECT * FROM prompts WHERE website_category_id = ${category.id} ORDER BY sort_order ASC, prompt_key ASC`;
      prompts = rows.map(r => ({
        ...r,
        copy_count:       Number(r.copy_count || 0),
        unlock_count:     Number(r.unlock_count || 0),
        like_count:       Number(r.like_count || 0),
        view_count:       Number(r.view_count || 0),
        is_featured:      parseDbBool(r.is_featured),
        is_premium:       parseDbBool(r.is_premium)
      }));
    }
  } catch (err) {
    console.error("Error fetching category:", err);
  }

  if (!category) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h2>Category Not Found</h2>
        <Link href="/" style={{ marginTop: '20px', color: 'var(--accent-main)' }}>Return to Home</Link>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.meta_title || category.name,
    "description": category.meta_description || category.description,
    "url": `https://promptking.in/category/${category.slug}`
  };

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px', color: 'white', maxWidth: '1400px', margin: '0 auto' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Category Header */}
      <style dangerouslySetInnerHTML={{__html: `
        .category-header {
          position: relative;
          padding: 60px 40px;
          border-radius: 32px;
          margin-bottom: 50px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 30px;
        }
        .category-title {
          font-size: clamp(2rem, 8vw, 4rem);
          font-weight: 900;
          margin-bottom: 20px;
          letter-spacing: -1.5px;
          background: linear-gradient(to right, #fff, rgba(255,255,255,0.6));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.1;
        }
        .stat-box-container {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
          min-width: 180px;
        }
        .header-content-left {
          position: relative;
          z-index: 1;
          flex: 1 1 300px;
        }
        @media (max-width: 768px) {
          .category-header {
            padding: 40px 25px;
            border-radius: 24px;
            gap: 20px;
          }
          .header-content-left {
            flex: 1 1 100%;
          }
          .stat-box-container {
            width: 100%;
            min-width: 100%;
          }
          .category-title {
            font-size: 2.5rem;
          }
        }
      `}} />
      <div className="category-header">
        {/* Glowing Orbs */}
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'var(--accent-main)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50%', right: '-10%', width: '400px', height: '400px', background: '#4285f4', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, pointerEvents: 'none' }} />

        <div className="header-content-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {category.tag && (
              <span style={{ 
                background: 'rgba(229, 9, 20, 0.15)', color: 'var(--accent-main)', fontSize: '0.75rem', fontWeight: 800, 
                padding: '6px 14px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', border: '1px solid rgba(229, 9, 20, 0.3)'
              }}>
                {category.tag}
              </span>
            )}
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Collection
            </span>
          </div>
          
          <h1 className="category-title">
            {category.name}
          </h1>
          
          {category.description && category.description.toLowerCase() !== category.name.toLowerCase() && category.description.toLowerCase() !== category.tag?.toLowerCase() && (
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', maxWidth: '650px', lineHeight: '1.6', margin: 0 }}>
              {category.description}
            </p>
          )}
        </div>

        <div className="stat-box-container">
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '5px', lineHeight: 1 }}>
              {prompts.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 800 }}>
              Prompts
            </div>
          </div>
        </div>
      </div>

      {/* Prompts Grid */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          Explore Prompts ({prompts.length})
        </h2>
        
        {prompts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '25px',
            width: '100%'
          }}>
            {prompts.map(prompt => (
              <PromptCard key={prompt.prompt_key} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontSize: '1.2rem' }}>No prompts found in this category yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
