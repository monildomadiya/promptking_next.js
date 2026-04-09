import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Shimmer from '../components/Common/Shimmer';
import { ArrowLeft, Clock, Calendar, Share2, ShieldCheck } from '../components/Common/Icons';
import SEOMetadata from '../components/SEO/SEOMetadata';
import SocialSidebar from '../components/Prompts/SocialSidebar';

const ArticlePage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [otherBlogs, setOtherBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blogs'); // Public endpoint
      const allBlogs = response.data;
      const found = allBlogs.find(b => b.slug === slug);
      setBlog(found);
      setOtherBlogs(allBlogs.filter(b => b.slug !== slug).slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch article", error);
      setLoading(false);
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

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': blog.title,
    'description': blog.content ? blog.content.replace(/<[^>]*>?/gm, '').substring(0, 200) : '',
    'image': blog.featured_image || 'https://promptking.in/favicon.png',
    'datePublished': blog.created_at,
    'dateModified': blog.updated_at || blog.created_at,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://promptking.in/article/${blog.slug}`
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
      '@type': 'Organization',
      'name': 'PromptKing',
      'url': 'https://promptking.in'
    }]
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 20px' }}>
      <SEOMetadata 
        title={`${blog.title} | PromptKing Blog`}
        description={blog.content ? blog.content.replace(/<[^>]*>?/gm, '').substring(0, 160) : `Read ${blog.title} on the PromptKing Blog.`}
        image={blog.featured_image || 'https://promptking.in/favicon.png'}
        url={`https://promptking.in/article/${blog.slug}`}
        type="article"
        publishedDate={blog.created_at}
        modifiedDate={blog.updated_at || blog.created_at}
        schema={articleSchema}
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
        <div className="main-content">
          {blog.featured_image && (
            <img src={blog.featured_image} alt={blog.title} style={{ width: '100%', borderRadius: '30px', marginBottom: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          )}
          
          <h1 style={{ 
            fontSize: '3rem', 
            marginBottom: '30px', 
            lineHeight: 1.2, 
            fontWeight: 800, 
            color: 'white',
            textShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>{blog.title}</h1>
          
          <div 
            className="blog-content" 
            dangerouslySetInnerHTML={{ __html: blog.content }} 
            style={{ fontSize: '1.2rem', lineHeight: 1.9, color: '#e0e0e0' }}
          />
        </div>

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
                        <img src={item.featured_image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        <Calendar size={10} /> {new Date(item.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
        .blog-content h2, .blog-content h3 { margin-top: 40px; margin-bottom: 20px; color: white; }
        .blog-content p { margin-bottom: 25px; }
        .blog-content img { max-width: 100%; border-radius: 15px; margin: 30px 0; }
        
        @media (max-width: 1024px) {
          .article-layout { grid-template-columns: 1fr; }
          .sidebar { order: 2; margin-top: 40px; }
          .main-content { order: 1; }
        }
      `}</style>
    </div>
  );
};

export default ArticlePage;
