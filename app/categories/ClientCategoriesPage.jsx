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
            background: 'rgba(255,255,255,0.05)', padding: '10px 20px', 
            borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '20px'
          }}>
            <Compass size={20} style={{ color: 'var(--accent-main)' }} />
            <span style={{ fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
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
                background: 'rgba(20, 20, 25, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '30px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = 'rgba(30, 30, 35, 0.8)'; 
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                e.currentTarget.querySelector('.cat-icon').style.transform = 'scale(1.2) rotate(10deg)';
                e.currentTarget.querySelector('.arrow-icon').style.transform = 'translateX(5px)';
                e.currentTarget.querySelector('.arrow-icon').style.opacity = '1';
                e.currentTarget.querySelector('.arrow-icon').style.color = 'white';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = 'rgba(20, 20, 25, 0.6)'; 
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                e.currentTarget.querySelector('.cat-icon').style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.querySelector('.arrow-icon').style.transform = 'translateX(0)';
                e.currentTarget.querySelector('.arrow-icon').style.opacity = '0.5';
                e.currentTarget.querySelector('.arrow-icon').style.color = 'var(--text-secondary)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div 
                  className="cat-icon"
                  style={{ 
                    width: '50px', height: '50px', borderRadius: '16px',
                    background: `linear-gradient(135deg, rgba(255,255,255,0.1), transparent)`,
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', fontWeight: 'bold', color: 'white',
                    transition: 'all 0.4s ease'
                  }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <ChevronRight 
                  className="arrow-icon" 
                  size={24} 
                  style={{ opacity: 0.5, transition: 'all 0.3s ease', color: 'var(--text-secondary)' }} 
                />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>
                {c.name}
              </h2>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
