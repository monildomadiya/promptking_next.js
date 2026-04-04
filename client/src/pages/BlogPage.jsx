import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import api from '../api';
import Shimmer from '../components/Common/Shimmer';
import SocialSidebar from '../components/Prompts/SocialSidebar';

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
    window.scrollTo(0, 0);
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await api.get('/blogs');
      setBlogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch blogs", error);
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="layout-with-sidebar">
      <div className="main-content-area">
        <header className="blog-hero">
          <Shimmer height="30px" width="150px" borderRadius="100px" style={{ margin: '0 auto 20px' }} />
          <Shimmer height="60px" width="400px" style={{ margin: '0 auto 20px' }} />
          <Shimmer height="20px" width="600px" style={{ margin: '0 auto' }} />
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

  return (
    <div className="layout-with-sidebar">
      <div className="main-content-area">
        <header className="blog-hero">
          <div style={{ 
            display: 'inline-block', 
            padding: '8px 20px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '100px', 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            color: 'var(--accent-main)',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
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
            background: 'rgba(255,255,255,0.03)', 
            backdropFilter: 'blur(15px)',
            borderRadius: '32px', 
            border: '1px solid rgba(255,255,255,0.08)' 
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'white' }}>No articles yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>We're currently crafting some amazing content for you. Check back soon!</p>
          </div>
        ) : (
          <div className="blog-grid">
            {blogs.map((blog, index) => (
              <Link 
                to={`/article/${blog.slug}`} 
                key={blog.id} 
                className="blog-card-new"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {blog.featured_image && (
                  <div className="blog-card-image-wrapper">
                    <img src={blog.featured_image} alt={blog.title} loading="lazy" />
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Clock size={12} /> 5 min read
                    </div>
                  </div>
                )}
                <div className="blog-card-content">
                  <h2 className="blog-card-title">{blog.title}</h2>
                  <p className="blog-card-excerpt">
                    {blog.content ? blog.content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...' : 'Dive into this insightful piece about AI and creativity...'}
                  </p>
                  <div className="blog-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <Calendar size={14} />
                      {new Date(blog.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
      <SocialSidebar />
    </div>
  );
};

export default BlogPage;
