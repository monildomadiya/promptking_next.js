"use client";
import React from 'react';
import { AlertTriangle, Info, ExternalLink, Cpu, ShieldCheck } from '@/components/Common/Icons';

import SocialSidebar from '@/components/Prompts/SocialSidebar';
import SEOMetadata from '@/components/SEO/SEOMetadata';

const DisclaimerPage = () => {
  return (
    <div className="layout-with-sidebar">
      <SEOMetadata 
        title="Disclaimer - PromptKing"
        description="Important information regarding our content, AI technology, and limitation of liability."
        url="https://promptking.in/disclaimer"
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
            LEGAL CENTER
          </div>
          <h1 style={{ fontSize: '3.5rem' }}>Disclaimer</h1>
          <p>Important information regarding our content and AI technology.</p>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ 
                padding: '12px', 
                borderRadius: '16px', 
                background: 'rgba(229, 9, 20, 0.1)', 
                color: 'var(--accent-main)' 
              }}>
                <Info size={28} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>General Information</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: 1.8 }}>
              The information provided by PromptKing on this website is for general informational purposes only. All information is provided in good faith, however, we make no representation or warranty of any kind.
            </p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ 
                padding: '12px', 
                borderRadius: '16px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: 'white' 
              }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>AI Model Performance</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8 }}>
              AI models such as ChatGPT, Midjourney, and Gemini are constantly evolving. Results may vary based on model updates, settings, and input variations. We are not responsible for any unexpected results or costs incurred from using third-party AI services.
            </p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ 
                padding: '12px', 
                borderRadius: '16px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: 'white' 
              }}>
                <ExternalLink size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>External Links</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8 }}>
              This site may contain links to external websites that are not provided or maintained by or in any way affiliated with PromptKing. Please note that we do not guarantee the accuracy or completeness of any information on these external websites.
            </p>
          </section>

          <div style={{ 
            background: 'rgba(229, 9, 20, 0.05)', 
            padding: '40px', 
            borderRadius: '32px', 
            border: '1px solid rgba(229, 9, 20, 0.2)',
            display: 'flex',
            gap: '20px',
            alignItems: 'center'
          }}>
            <AlertTriangle size={48} style={{ color: 'var(--accent-main)', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Limitation of Responsibility</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                PromptKing is not liable for how you use the prompts or the results they produce. Please use AI responsibly.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SocialSidebar />
    </div>
  );
};

export default DisclaimerPage;
