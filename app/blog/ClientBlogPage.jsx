"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from '@/components/Common/Icons';
import api from '@/lib/api';
import Shimmer from '@/components/Common/Shimmer';
import SocialSidebar from '@/components/Prompts/SocialSidebar';
import SEOMetadata from '@/components/SEO/SEOMetadata';
import { optimizeImage } from '@/utils/imageUtils';
import { getCache, setCache } from '@/utils/cacheUtils';
import { useAppContext } from '@/components/AppContext';
import AdSenseUnit from '@/components/Ads/AdSenseUnit';

const ClientBlogPage = ({ initialBlogs = [] }) => {
  const { settings } = useAppContext();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [loading, setLoading] = useState(initialBlogs.length === 0);


  async function fetchBlogs() {
    const cacheKey = 'pk_blog_list';
    const cachedData = getCache(cacheKey);
    if (cachedData && cachedData.length > 0) {
      setBlogs(cachedData);
      setLoading(false);
      return; // Early return to prevent redundant background request
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get('/blogs');
      setCache(cacheKey, response.data);
      setBlogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch blogs", error);
      if (!cachedData) setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBlogs && initialBlogs.length > 0) return; // already have SSR data
    fetchBlogs();
  }, []);


  if (loading) return (
    <div className="layout-with-sidebar">
      <SEOMetadata
        title="PromptKing Blog - AI Prompt Tips, Guides & Updates"
        description="Explore tutorials, tips and news about AI prompts, creative workflows, ChatGPT, Midjourney, Gemini, and the latest PromptKing updates."
        url="https://promptking.in/blog"
      />
      <div className="main-content-area">
        <header className="blog-hero">
          <Shimmer height="30px" width="150px" borderRadius="100px" style={{ margin: '0 auto 20px' }} />
          <Shimmer height="60px" width="100%" style={{ maxWidth: '400px', margin: '0 auto 20px' }} />
          <Shimmer height="20px" width="100%" style={{ maxWidth: '600px', margin: '0 auto' }} />
        </header>

        <div className="blog-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="blog-card-new">
              <Shimmer height="240px" />
              <div className="blog-card-content">
                <Shimmer height="28px" style={{ marginBottom: '15px' }} />
                <Shimmer height="60px" style={{ marginBottom: '25px' }} />
                <div className="blog-card-footer">
                  <Shimmer height="18px" width="120px" />
                  <Shimmer height="18px" width="80px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="social-sidebar">
        <Shimmer height="600px" borderRadius="32px" />
      </div>
    </div>
  );

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'PromptKing Blog - AI Tips, Guides & Updates',
    'description': 'Explore insights, tutorials, and news about AI prompts, creative workflows, and the latest from the PromptKing platform.',
    'url': 'https://promptking.in/blog',
    ...(blogs.length > 0 && {
      'hasPart': blogs.map(b => ({
        '@type': 'BlogPosting',
        'headline': b.title,
        'url': `https://promptking.in/article/${b.slug}`,
        'image': b.featured_image,
        'datePublished': b.created_at,
      }))
    })
  };

  return (
    <div className="layout-with-sidebar">
      <SEOMetadata
        title="PromptKing Blog - AI Prompt Tips, Guides & Updates"
        description="Explore tutorials, tips and news about AI prompts, creative workflows, ChatGPT, Midjourney, Gemini, and the latest PromptKing updates."
        keywords="promptking blog, ai prompt tips, chatgpt guide, midjourney tutorial, ai workflow, prompt engineering blog"
        url="https://promptking.in/blog"
        schema={blogSchema}
        breadcrumb={[{ name: 'Home', url: 'https://promptking.in/' }, { name: 'Blog', url: 'https://promptking.in/blog' }]}
      />
      <div className="main-content-area">
        <header className="blog-hero">
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(229,9,20,0.08)',
            borderRadius: '100px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--accent-main)',
            marginBottom: '20px',
            border: '1px solid rgba(229,9,20,0.2)'
          }}>
            INSIGHTS & UPDATES
          </div>
          <h1>Our Latest Stories</h1>
          <p>Explore the world of AI prompting, creative design, and the latest platform updates from the PromptKing team.</p>
        </header>

        {blogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 40px',
            background: '#ffffff',
            backdropFilter: 'blur(15px)',
            borderRadius: '32px',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--text-main)' }}>No articles yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>We're currently crafting some amazing content for you. Check back soon!</p>
          </div>
        ) : (
          <div className="blog-grid">
            {blogs.map((blog, index) => (
              <Link 
                href={`/article/${blog.slug}`} 
                key={blog.id} 
                className="blog-card-new"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {blog.featured_image && (
                  <div className="blog-card-image-wrapper">
                    <img src={optimizeImage(blog.featured_image, 500)} alt={blog.featured_image_alt || blog.title} loading="lazy" width="500" height="280" style={{ objectFit: 'cover' }} />
                    <div style={{ 
                      position: 'absolute', 
                      top: '20px', 
                      right: '20px', 
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(10px)',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Clock size={12} /> {blog.read_time || '5 min read'}
                    </div>
                  </div>
                )}
                <div className="blog-card-content">
                  <h2 className="blog-card-title">{blog.title}</h2>
                  <p className="blog-card-excerpt">
                    {blog.excerpt || (blog.content_fallback ? blog.content_fallback.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...' : 'Dive into this insightful piece about AI and creativity...')}
                  </p>
                  <div className="blog-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <Calendar size={14} />
                      {new Date(blog.published_at || blog.created_at || '2024-01-01').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="read-more-btn">
                      Read More <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SocialSidebar />
        {settings?.adsense_enabled === '1' && settings?.adsense_slot_sidebar && (
          <div style={{ position: 'sticky', top: '110px' }}>
            <AdSenseUnit client={settings.adsense_client_id} slot={settings.adsense_slot_sidebar} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBlogPage;
