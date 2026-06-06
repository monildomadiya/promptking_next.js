import React, { useState } from 'react';
import { Mail, MessageCircle, Send, CheckCircle, Sparkles, Instagram, Youtube, Twitter } from '../components/Common/Icons';
import SocialSidebar from '../components/Prompts/SocialSidebar';
import SEOMetadata from '../components/SEO/SEOMetadata';
import api from '../api';
const ContactPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contact', formData);
      setIsSubmitted(true);
      setTimeout(() => {
        setFormData({ name: '', email: '', message: '' });
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again later.');
    }
  };

  return (
    <div className="layout-with-sidebar">
      <SEOMetadata 
        title="Contact Us - PromptKing"
        description="Get in touch with the PromptKing team. We're here to help with support, collaboration, and feedback."
        url="https://promptking.in/contact"
        breadcrumb={[{ name: 'Home', url: 'https://promptking.in/' }, { name: 'Contact', url: 'https://promptking.in/contact' }]}
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
            GET IN TOUCH
          </div>
          <h1 style={{ fontSize: '3.5rem' }}>Contact Us</h1>
          <p>Have questions or feedback? We'd love to hear from you.</p>
        </header>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1.5fr' : '1fr',
          gap: '40px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '30px', borderRadius: '30px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(229, 9, 20, 0.1)', color: 'var(--accent-main)' }}>
                  <Mail size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Email Us</h3>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '10px' }}>For support & collaboration inquiries:</p>
              <a href="mailto:promptking.in@gmail.com" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem', wordBreak: 'break-all' }}>promptking.in@gmail.com</a>
            </div>

            <div className="glass-card" style={{ padding: '30px', borderRadius: '30px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <MessageCircle size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Social Connect</h3>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <a href="#" style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white' }}><Instagram size={20} /></a>
                <a href="#" style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white' }}><Youtube size={20} /></a>
                <a href="#" style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white' }}><Twitter size={20} /></a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-card" style={{ 
            padding: '50px', 
            borderRadius: '40px', 
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {isSubmitted ? (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center',
                animation: 'fadeIn 0.5s ease'
              }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(39, 201, 63, 0.1)', color: '#27C93F', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <CheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '12px' }}>Message Received!</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>We'll get back to you within 24 hours.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="glass-button-secondary"
                  style={{ marginTop: '30px', padding: '12px 30px', borderRadius: '12px' }}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <Sparkles size={20} color="var(--accent-main)" />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Send a Message</h3>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="glass-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your name"
                    style={{ width: '100%', padding: '16px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="glass-input" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="hello@example.com"
                    style={{ width: '100%', padding: '16px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>Message</label>
                  <textarea 
                    required 
                    rows="5"
                    className="glass-input" 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us what's on your mind..."
                    style={{ width: '100%', padding: '16px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', resize: 'none' }} 
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  style={{ 
                    marginTop: '10px',
                    padding: '18px', 
                    borderRadius: '18px', 
                    background: 'var(--accent-gradient)', 
                    color: 'white', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontWeight: 900, 
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 10px 30px rgba(229, 9, 20, 0.3)'
                  }}
                >
                  <Send size={20} /> PUSH MESSAGE
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <SocialSidebar />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ContactPage;
