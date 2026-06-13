import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

let cachedCategories = null;

const CategorySlider = () => {
  const [categories, setCategories] = useState(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedCategories);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/website_categories');
        cachedCategories = res.data;
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (!loading && categories.length === 0) return null;

  return (
    <div style={{ padding: '0 20px', maxWidth: '1400px', margin: '40px auto 20px' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px', color: 'white' }}>
        Browse by Category
      </h2>
      <div className="hide-scrollbar category-slider-container">
        {loading && categories.length === 0 ? (
          [1, 2, 3, 4, 5, 6].map((skel) => (
            <div 
              key={skel} 
              className="category-slider-item shimmer-bg"
              style={{
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            />
          ))
        ) : (
          categories.map((cat, i) => (
          <Link 
            key={cat.id} 
            to={`/category/${cat.slug}`}
            className="category-slider-item"
            style={{
              textDecoration: 'none',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              scrollSnapAlign: 'start',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'var(--surface-1)'
            }}
          >
            {cat.image_url ? (
              <img 
                src={cat.image_url} 
                alt={cat.name} 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  filter: 'brightness(0.6) saturate(1.2)',
                  transition: 'transform 0.4s ease'
                }} 
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #e50914 0%, #000 100%)', opacity: 0.8 }} />
            )}
            
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' 
            }} />

            <div className="category-slider-content">
              {cat.tag && (
                <span className="category-slider-tag" style={{ 
                  background: 'var(--accent-main)', 
                  color: 'white', 
                  fontSize: '0.65rem', 
                  fontWeight: 800, 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  marginBottom: '10px',
                  display: 'inline-block'
                }}>
                  {cat.tag}
                </span>
              )}
              <h3 className="category-slider-title" style={{ 
                color: 'white', 
                fontSize: '1.25rem', 
                fontWeight: 800, 
                letterSpacing: '-0.3px',
                margin: 0
              }}>
                {cat.name}
              </h3>
            </div>
          </Link>
        )))}
      </div>
    </div>
  );
};

export default CategorySlider;
