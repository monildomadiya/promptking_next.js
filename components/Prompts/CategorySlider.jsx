"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

// Module-level cache — persists for the lifetime of the browser session
let cachedCategories = null;

// CategorySlider accepts initialCategories from the server (SSR).
// If not provided, falls back to client-side fetch with module-level cache.
const CategorySlider = ({ initialCategories = [] }) => {
  const [categories, setCategories] = useState(
    initialCategories.length > 0 ? initialCategories : (cachedCategories || [])
  );
  const [loading, setLoading] = useState(
    initialCategories.length === 0 && !cachedCategories
  );

  useEffect(() => {
    // If we already have data from SSR or module cache, update cache and skip fetch
    if (initialCategories.length > 0) {
      cachedCategories = initialCategories;
      return;
    }
    if (cachedCategories) {
      setCategories(cachedCategories);
      setLoading(false);
      return;
    }
    // Only hit the network if we have no data at all
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
  }, [initialCategories]);

  if (categories.length === 0) return null;

  return (
    <div style={{ padding: '0 20px', maxWidth: '1400px', margin: '40px auto 20px' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
        Browse by Category
      </h2>
      <div className="hide-scrollbar category-slider-container">
        {categories.map((cat, i) => (
          <Link 
            key={cat.id} 
            href={`/category/${cat.slug}`}
            className="category-slider-item glass-card"
            style={{
              textDecoration: 'none',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              scrollSnapAlign: 'start',
              boxShadow: '0 10px 30px rgba(17,24,39,0.12)',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(0, 0, 0, 0.02)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
            }}
          >
            {cat.image_url ? (
              <img 
                src={cat.image_url} 
                alt={cat.name} 
                loading={i < 4 ? 'eager' : 'lazy'}
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }} 
                className="category-slider-img"
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #e50914 0%, #000 100%)', opacity: 0.8 }} />
            )}

            {cat.tag && (
              <span className="category-slider-tag" style={{ 
                position: 'absolute',
                top: '15px',
                left: '15px',
                background: 'rgba(229, 9, 20, 0.9)', 
                color: 'white', 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                padding: '6px 12px', 
                borderRadius: '12px', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                zIndex: 3,
                backdropFilter: 'blur(5px)'
              }}>
                {cat.tag}
              </span>
            )}

            <div className="category-slider-content">
              <h3 className="category-slider-title" style={{ 
                color: 'white', 
                fontSize: '1.5rem', 
                fontWeight: 900, 
                letterSpacing: '-0.5px',
                margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}>
                {cat.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategorySlider;
