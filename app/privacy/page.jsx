"use client";
import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle, ShieldCheck } from '@/components/Common/Icons';

import SocialSidebar from '@/components/Prompts/SocialSidebar';
import SEOMetadata from '@/components/SEO/SEOMetadata';

const PrivacyPage = () => {
  return (
    <div className="layout-with-sidebar">
      <SEOMetadata 
        title="Privacy Policy - PromptKing"
        description="Learn how PromptKing handles your data, cookies, and privacy."
        url="https://promptking.in/privacy"
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
          <h1 style={{ fontSize: '3.5rem' }}>Privacy Policy</h1>
          <p>Your privacy is our priority. Learn how we handle your data.</p>
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
              <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(229, 9, 20, 0.1)', color: 'var(--accent-main)' }}>
                <Shield size={28} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Privacy Policy for PromptKing</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8 }}>
              At PromptKing, accessible from https://promptking.in, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by PromptKing and how we use it.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8, marginTop: '15px' }}>
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
            </p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Google DoubleClick DART Cookie</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8 }}>
              Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.website.com and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-main)' }}>Google Ad and Content Network Privacy Policy</a>
            </p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Advertising Partners Privacy Policies</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8 }}>
              You may consult this list to find the Privacy Policy for each of the advertising partners of PromptKing.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, marginTop: '15px' }}>
              Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on PromptKing, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, marginTop: '15px', paddingLeft: '20px' }}>
              <li>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.</li>
              <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.</li>
              <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-main)' }}>Ads Settings</a> or by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-main)' }}>www.aboutads.info</a>.</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, marginTop: '15px' }}>
              Note that PromptKing has no access to or control over these cookies that are used by third-party advertisers.
            </p>
          </section>

          <section style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Log Files</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8 }}>
              PromptKing follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
            </p>
          </section>

          <section style={{ 
            background: 'rgba(16, 163, 127, 0.05)', 
            padding: '40px', 
            borderRadius: '32px', 
            border: '1px solid rgba(16, 163, 127, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <CheckCircle size={48} style={{ color: '#10a37f', marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Consent</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
              By using our website, you hereby consent to our Privacy Policy and agree to its terms.
            </p>
          </section>
        </div>
      </div>
      <SocialSidebar />
    </div>
  );
};

export default PrivacyPage;
