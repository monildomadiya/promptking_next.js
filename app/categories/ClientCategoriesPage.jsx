"use client";
import React from 'react';
import Link from 'next/link';
import { Compass, ChevronRight } from '@/components/Common/Icons';

export default function ClientCategoriesPage({ categories }) {
  return (
    <main style={{ padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '10px', 
            background: 'rgba(0,0,0,0.04)', padding: '10px 20px',
            borderRadius: '30px', border: '1px solid rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <Compass size={20} style={{ color: 'var(--accent-main)' }} />
            <span style={{ fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Explore Library
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1 }}>
            Discover <span style={{ color: 'var(--accent-main)' }}>Categories</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Browse through our curated collection of high-quality AI prompts tailored for specific tasks, industries, and creative workflows.
          </p>
        </div>

        {/* Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {categories.map((c, i) => (
            <Link 
              key={c.id} 
              href={`/category/${c.slug}`}
              className="category-page-card"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '24px',
                padding: '0',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 10px 30px rgba(17,24,39,0.1)',
                minHeight: '160px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.18)';
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(17,24,39,0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(17,24,39,0.1)';
              }}
            >
              {/* Background image (or branded fallback) */}
              {c.image_url ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${c.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '24px',
                }} />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, #e50914 0%, #1a1a1a 100%)',
                  borderRadius: '24px',
                }} />
              )}

              {/* Gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 60%, transparent)',
                borderRadius: '24px',
              }} />

              {/* Content */}
              <div style={{
                position: 'relative', zIndex: 1,
                padding: '24px 28px',
                marginTop: 'auto',
              }}>
                {/* Tag badge */}
                {c.tag && (
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(255,193,7,0.15)',
                    border: '1px solid rgba(255,193,7,0.3)',
                    borderRadius: '20px',
                    padding: '3px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--accent-main)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}>
                    {c.tag}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', margin: 0 }}>
                    {c.name}
                  </h2>
                  <ChevronRight
                    size={22}
                    style={{ opacity: 0.7, color: 'white', flexShrink: 0 }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.2rem' }}>No categories found.</p>
          </div>
        )}

      </div>
    </main>
  );
}
