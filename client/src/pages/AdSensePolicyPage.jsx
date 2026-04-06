import React from 'react';
import { ShieldCheck, Info, ExternalLink, Globe, Cookie } from '../components/Common/Icons';

import SocialSidebar from '../components/Prompts/SocialSidebar';

const AdSensePolicyPage = () => {
  return (
    <div className="layout-with-sidebar">
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
            LEGAL & COMPLIANCE
          </div>
          <h1 style={{ fontSize: '3.5rem' }}>AdSense Policy</h1>
          <p>Transparency regarding our relationship with Google AdSense and third-party advertising.</p>
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
                <ShieldCheck size={28} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Advertising Policy</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: 1.8 }}>
              PromptKing uses Google AdSense to serve advertisements. We believe in being fully transparent with our users about how these ads are served and what data is involved.
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
                <Cookie size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Third-Party Cookies</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8 }}>
              Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.
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
                <Globe size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Opting Out</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8 }}>
              Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-main)', textDecoration: 'underline' }}>Ads Settings</a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-main)', textDecoration: 'underline' }}>www.aboutads.info</a>.
            </p>
          </section>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            padding: '40px', 
            borderRadius: '32px', 
            border: '1px solid var(--border-color)',
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start'
          }}>
            <Info size={32} style={{ color: 'var(--accent-main)', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Additional Information</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                We have no access to or control over these cookies that are used by third-party advertisers. You should consult the respective privacy policies of these third-party ad servers for more detailed information.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SocialSidebar />
    </div>
  );
};

export default AdSensePolicyPage;
