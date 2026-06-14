"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowRight } from '../Common/Icons';
import Shimmer from '../Common/Shimmer';

const BlogSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const optimizeImage = (url, width = 600) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      return `/api/optimize?src=${encodeURIComponent(url)}&w=${width}`;
    }
    return url;
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await api.get('/blogs');
      setBlogs(response.data.slice(0, 3)); // Only show top 3
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch blogs for section", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section style={{ padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <Shimmer height="40px" width="100%" style={{ maxWidth: '300px', marginBottom: '10px' }} />
              <Shimmer height="20px" width="100%" style={{ maxWidth: '450px' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Shimmer height="220px" />
                <div style={{ padding: '30px' }}>
                  <Shimmer height="24px" style={{ marginBottom: '15px' }} />
                  <Shimmer height="40px" style={{ marginBottom: '20px' }} />
                  <Shimmer height="18px" width="100px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (blogs.length === 0) return null;

  return (
    <section style={{ padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>Latest from Blog</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Expert insights, AI tips, and industry updates.</p>
          </div>
          <Link href="/blog" style={{ 
            color: 'var(--accent-main)', 
            textDecoration: 'none', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '1rem',
            padding: '10px 20px',
            borderRadius: '50px',
            background: 'rgba(229, 9, 20, 0.1)',
            transition: '0.3s'
          }} className="view-all-btn">
            View All Articles <ArrowRight size={18} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
          {blogs.map(blog => (
            <Link href={`/article/${blog.slug}`} key={blog.id} style={{ 
              background: 'var(--surface-color)', 
              borderRadius: '24px', 
              overflow: 'hidden', 
              border: '1px solid var(--border-color)', 
              textDecoration: 'none',
              color: 'inherit',
              transition: '0.4s'
            }} className="blog-card-home">
              <div style={{ height: '220px', overflow: 'hidden' }}>
                <img src={optimizeImage(blog.featured_image || 'https://via.placeholder.com/600x400/111/444?text=PromptKing+Blog', 600)} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.5s' }} className="blog-img" />
              </div>
              <div style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '15px', lineHeight: 1.3 }}>{blog.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {blog.content ? blog.content.replace(/<[^>]*>?/gm, '') : ''}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
                  Read More <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @media (hover: hover) {
          .blog-card-home:hover { transform: translateY(-10px); border-color: var(--accent-main); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
          .blog-card-home:hover .blog-img { transform: scale(1.05); }
          .view-all-btn:hover { background: var(--accent-main); color: white; transform: translateX(5px); }
        }
      `}</style>
    </section>
  );
};

export default BlogSection;

