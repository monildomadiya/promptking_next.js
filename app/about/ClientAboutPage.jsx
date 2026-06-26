"use client";
import React from 'react';
import { Target, Rocket, Award, Shield, Zap, Sparkles } from '@/components/Common/Icons';

import SocialSidebar from '@/components/Prompts/SocialSidebar';
import SEOMetadata from '@/components/SEO/SEOMetadata';

const ClientAboutPage = () => {
  return (
    <div className="layout-with-sidebar">
      <SEOMetadata 
        title="About Us - PromptKing"
        description="Learn about PromptKing, our mission, and why we are the premier enterprise-grade library for high-performance AI prompts."
        url="https://promptking.in/about"
        breadcrumb={[{ name: 'Home', url: 'https://promptking.in/' }, { name: 'About', url: 'https://promptking.in/about' }]}
      />
      <div className="main-content-area">
        <header className="blog-hero" style={{ marginBottom: '40px' }}>
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
            OUR VISION
          </div>
          <h1 style={{ fontSize: '3.5rem' }}>About PromptKing</h1>
          <p>Premium enterprise-grade library for high-performance AI prompts.</p>
        </header>

        <div style={{ 
          maxWidth: '850px', 
          margin: '0 auto',
          padding: '60px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '40px',
          border: '1px solid var(--border-color)',
          backdropFilter: 'blur(20px)',
        }}>
          <section style={{ marginBottom: '50px' }}>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1.2rem', 
              lineHeight: 1.8, 
              marginBottom: '40px',
              textAlign: 'center'
            }}>
              Welcome to <strong>PromptKing</strong>, the premier enterprise-grade library for high-performance AI prompts. We specialize in curating and optimizing prompts for the world's most advanced AI models, including ChatGPT, Midjourney, and Google Gemini.
            </p>
          </section>

          <section style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ 
                padding: '12px', 
                borderRadius: '16px', 
                background: 'rgba(229, 9, 20, 0.1)', 
                color: 'var(--accent-main)' 
              }}>
                <Target size={28} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Our Mission</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8 }}>
              Our mission is to bridge the gap between human creativity and artificial intelligence. We believe that the right prompt is the key to unlocking the true potential of AI, whether you are a digital artist, a developer, or a content creator.
            </p>
          </section>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            padding: '40px', 
            borderRadius: '32px', 
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles style={{ color: 'var(--accent-main)' }} /> Why Choose Us?
            </h3>
            <div style={{ display: 'grid', gap: '25px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ color: 'var(--accent-main)', marginTop: '4px' }}><Award size={20} /></div>
                <div>
                  <h4 style={{ marginBottom: '6px', fontSize: '1.1rem' }}>Curated Quality</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Every prompt is tested for consistency and high-quality output by our expert prompt engineers.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ color: 'var(--accent-main)', marginTop: '4px' }}><Zap size={20} /></div>
                <div>
                  <h4 style={{ marginBottom: '6px', fontSize: '1.1rem' }}>Visual Previews</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Our unique Before/After sliders and comparison tools show you exactly what to expect from each prompt.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ color: 'var(--accent-main)', marginTop: '4px' }}><Shield size={20} /></div>
                <div>
                  <h4 style={{ marginBottom: '6px', fontSize: '1.1rem' }}>Instant Access</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Secure, PIN-protected delivery for premium assets ensures that your purchases are always safe and available.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SocialSidebar />
    </div>
  );
};

export default ClientAboutPage;
