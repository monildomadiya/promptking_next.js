import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Shimmer from '../components/Common/Shimmer';
import { ArrowLeft, Clock, Calendar, Share2, ShieldCheck, Tag, User } from '../components/Common/Icons';
import SEOMetadata from '../components/SEO/SEOMetadata';
import SocialSidebar from '../components/Prompts/SocialSidebar';
import { optimizeImage } from '../utils/imageUtils';
import { getCache, setCache } from '../utils/cacheUtils';

const ArticlePage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [otherBlogs, setOtherBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    const cacheKey = `pk_article_${slug}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      setBlog(cachedData.blog);
      setOtherBlogs(cachedData.otherBlogs);
      setLoading(false);
      return; // Early return to prevent redundant requests
    } else {
      setLoading(true);
    }

    try {
      // Fetch the single article with full content
      const blogRes = await api.get(`/blog/${slug}`);
      const fetchedBlog = blogRes.data;

      // Fetch lightweight list of all blogs for the sidebar
      let fetchedOtherBlogs = [];
      const blogListCache = getCache('pk_blog_list');
      if (blogListCache && blogListCache.length > 0) {
        fetchedOtherBlogs = blogListCache.filter(b => b.slug !== slug).slice(0, 5);
      } else {
        const allBlogsRes = await api.get('/blogs');
        fetchedOtherBlogs = allBlogsRes.data.filter(b => b.slug !== slug).slice(0, 5);
      }

      setCache(cacheKey, { blog: fetchedBlog, otherBlogs: fetchedOtherBlogs });
      setBlog(fetchedBlog);
      setOtherBlogs(fetchedOtherBlogs);

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch article", error);
      if (!cachedData) setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 20px' }}>
      <Shimmer height="20px" width="120px" style={{ marginBottom: '40px' }} />
      <div className="article-layout">
        <div className="main-content">
          <Shimmer height="400px" borderRadius="30px" style={{ marginBottom: '40px' }} />
          <Shimmer height="60px" width="80%" style={{ marginBottom: '30px' }} />
          <Shimmer height="20px" style={{ marginBottom: '15px' }} />
          <Shimmer height="20px" style={{ marginBottom: '15px' }} />
          <Shimmer height="20px" width="70%" style={{ marginBottom: '15px' }} />
        </div>
        <aside className="sidebar">
          <Shimmer height="500px" borderRadius="24px" />
        </aside>
      </div>
    </div>
  );
  
  if (!blog) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <SEOMetadata title="Article Not Found | PromptKing" />
      Article not found.
    </div>
  );

  let parsedFaqs = [];
  try { parsedFaqs = typeof blog.faqs === 'string' ? JSON.parse(blog.faqs) : (blog.faqs || []); } catch(e) {}

  let parsedTags = [];
  try { parsedTags = typeof blog.tags === 'string' ? JSON.parse(blog.tags) : (blog.tags || []); } catch(e) {}

  const plainTextContent = blog.content ? blog.content.replace(/<[^>]*>?/gm, '') : '';
  const metaDescFallback = plainTextContent.substring(0, 160);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': blog.meta_title || blog.title,
    'description': blog.meta_description || blog.excerpt || metaDescFallback,
    'image': blog.og_image || blog.featured_image || 'https://promptking.in/favicon.png',
    'datePublished': blog.published_at || blog.created_at,
    'dateModified': blog.updated_at || blog.created_at,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': blog.canonical_url || `https://promptking.in/article/${blog.slug}`
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'PromptKing',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://promptking.in/favicon.png'
      }
    },
    'author': [{
      '@type': 'Person',
      'name': blog.author_name || 'PromptKing',
      'url': 'https://promptking.in'
    }]
  };

  const schemas = [articleSchema];

  if (parsedFaqs && parsedFaqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': parsedFaqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    });
  }

  // Generate Table of Contents
  const extractHeadings = () => {
    if (!blog.content) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(blog.content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    return Array.from(headings).map(h => ({
      tag: h.tagName.toLowerCase(),
      text: h.textContent,
      id: h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }));
  };

  const headings = extractHeadings();

  // Inject IDs into content for TOC linking
  let finalContent = blog.content;
  if (blog.enable_table_of_contents !== false && headings.length > 0) {
    headings.forEach(h => {
      const regex = new RegExp(`(<${h.tag}[^>]*>)(.*?)(</${h.tag}>)`, 'i');
      finalContent = finalContent.replace(regex, `$1<a id="${h.id}"></a>$2$3`);
    });
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 20px' }}>
      <SEOMetadata 
        title={blog.meta_title || `${blog.title} | PromptKing Blog`}
        description={blog.meta_description || blog.excerpt || metaDescFallback}
        image={blog.featured_image || 'https://promptking.in/favicon.png'}
        url={`https://promptking.in/article/${blog.slug}`}
        canonicalUrlOverride={blog.canonical_url}
        type="article"
        publishedDate={blog.published_at || blog.created_at}
        modifiedDate={blog.updated_at || blog.created_at}
        schema={schemas}
        ogTitle={blog.og_title}
        ogDescription={blog.og_description}
        ogImage={blog.og_image}
        twitterTitle={blog.twitter_title}
        twitterDescription={blog.twitter_description}
        twitterImage={blog.twitter_image}
        breadcrumb={[
          { name: 'Home', url: 'https://promptking.in/' },
          { name: 'Blog', url: 'https://promptking.in/blog' },
          { name: blog.title, url: `https://promptking.in/article/${blog.slug}` }
        ]}
      />
      <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '40px', textDecoration: 'none', fontWeight: 600 }}>
        <ArrowLeft size={18} /> Back to Blog
      </Link>

      <div className="article-layout">
        {/* Main Article Content */}
        <article className="main-content">
          {blog.featured_image && (
            <div style={{ marginBottom: '40px' }}>
              <img 
                src={optimizeImage(blog.featured_image, 1200)} 
                alt={blog.featured_image_alt || blog.title} 
                style={{ width: '100%', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
              />
              {blog.featured_image_caption && (
                <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {blog.featured_image_caption}
                </p>
              )}
            </div>
          )}
          
          {blog.category && (
            <div style={{ display: 'inline-block', background: 'rgba(229,9,20,0.1)', color: 'var(--accent-main)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '20px' }}>
              {blog.category}
            </div>
          )}

          <h1 style={{ 
            fontSize: window.innerWidth <= 1100 ? '2.2rem' : '3rem', 
            marginBottom: '30px', 
            lineHeight: 1.2, 
            fontWeight: 800, 
            color: 'white',
            textShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>{blog.title}</h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {blog.author_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                <User size={16} color="var(--accent-main)" /> {blog.author_name}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              <Calendar size={16} color="var(--accent-main)" /> {new Date(blog.published_at || blog.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            {blog.read_time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                <Clock size={16} color="var(--accent-main)" /> {blog.read_time}
              </div>
            )}
          </div>

          {/* Table of Contents */}
          {blog.enable_table_of_contents !== false && headings.length > 0 && (
            <div className="blog-toc">
              <h3>Table of Contents</h3>
              <ul>
                {headings.map((h, i) => (
                  <li key={i} style={{ paddingLeft: h.tag === 'h3' ? '16px' : '0' }}>
                    <a href={`#${h.id}`}>
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div 
            className="blog-content" 
            dangerouslySetInnerHTML={{ __html: finalContent }} 
            style={{ fontSize: '1.15rem', lineHeight: 1.9, color: '#d1d1d1' }}
          />

          {/* Tags */}
          {parsedTags.length > 0 && (
            <div style={{ marginTop: '50px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <Tag size={18} color="var(--text-dim)" />
              {parsedTags.map((tag, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Author Box */}
          <div className="author-box" style={{
            marginTop: '60px',
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
                src={blog.author_image ? optimizeImage(blog.author_image, 150) : "https://github.com/monildomadiya.png"} 
                alt={blog.author_name || 'PromptKing Admin'} 
                style={{ 
                  width: '90px', height: '90px', borderRadius: '50%', 
                  objectFit: 'cover', border: '3px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }} 
                onError={(e) => { e.target.src = 'https://promptking.in/favicon.png' }}
              />
            </div>
            <div style={{ zIndex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>About the Author</div>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: '10px' }}>{blog.author_name || 'PromptKing Admin'}</h4>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                {blog.author_description || 'Passionate about AI and creative workflows. Exploring the frontiers of prompt engineering to help you unlock the true potential of tools like ChatGPT, Midjourney, and Gemini.'}
              </p>
            </div>
          </div>

          {/* FAQs */}
          {parsedFaqs && parsedFaqs.length > 0 && (
            <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: 'white', fontWeight: 800 }}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {parsedFaqs.map((faq, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'white', fontWeight: 700 }}>{faq.question}</h3>
                    <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </article>

        {/* Sidebar */}
        <aside className="sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'sticky', top: '100px' }}>
            {/* More Articles Box */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              padding: '30px', 
              borderRadius: '24px', 
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ 
                fontSize: '1.4rem', 
                marginBottom: '25px', 
                color: 'white', 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ width: '4px', height: '20px', background: 'var(--accent-main)', borderRadius: '10px' }}></span>
                More Articles
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {otherBlogs.map(item => (
                  <Link to={`/article/${item.slug}`} key={item.id} style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    textDecoration: 'none', 
                    color: 'inherit',
                    transition: '0.3s'
                  }} className="sidebar-blog-card">
                    {item.featured_image && (
                      <div style={{ width: '70px', height: '54px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={optimizeImage(item.featured_image, 150)} alt={item.title} loading="lazy" width="70" height="54" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 600, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden', 
                        lineHeight: 1.4,
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: '4px'
                      }}>
                        {item.title}
                      </h4>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={10} /> {new Date(item.published_at || item.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/blog" style={{ 
                display: 'block', 
                marginTop: '30px', 
                textAlign: 'center', 
                color: 'var(--accent-main)', 
                fontWeight: 700, 
                textDecoration: 'none', 
                fontSize: '0.85rem',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: '0.3s'
              }} className="view-all-btn">
                View All Posts
              </Link>
            </div>

            {/* Official Channels */}
            <SocialSidebar />
          </div>
        </aside>
      </div>
      
      <style>{`
        .article-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 60px;
        }
        @media (hover: hover) {
          .sidebar-blog-card:hover { transform: translateX(5px); color: var(--accent-main); }
        }
        @media (max-width: 1100px) {
          .article-layout { grid-template-columns: 1fr; }
          .sidebar { order: 2; margin-top: 40px; }
          .main-content { order: 1; }
        }
      `}</style>
    </div>
  );
};

export default ArticlePage;
