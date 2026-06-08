import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api';
import { Activity, Check, X, Shield } from '../Common/Icons';

const glassPanelStyle = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--glass-border)',
  borderRadius: '24px',
};

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  color: 'white',
  fontSize: '0.95rem',
  transition: 'var(--transition-fast)',
  outline: 'none',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '150px',
  resize: 'vertical'
};

const SEOManagerPanel = () => {
  const [formData, setFormData] = useState({ title: '', description: '', content: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await api.post('/admin/seo_analyze', formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <div style={{ ...glassPanelStyle, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(16,163,127,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="#10a37f" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2px' }}>SEO Manager</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Analyze your content for Google Search ranking.</p>
          </div>
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={loading || (!formData.title && !formData.description && !formData.content)}
          className="glass-button-secondary"
          style={{ 
            padding: '12px 24px', borderRadius: '12px', background: '#10a37f', 
            color: 'white', border: 'none', fontWeight: 700, opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? "Analyzing..." : "Analyze Content"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        <div style={{ ...glassPanelStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Meta Title</label>
            <input 
              style={inputStyle}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Best Midjourney Prompts 2026"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Meta Description</label>
            <textarea 
              style={{...textareaStyle, minHeight: '80px'}}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="A brief summary of your page content for search results..."
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Main Content / Prompt</label>
            <textarea 
              style={textareaStyle}
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="Paste your prompt or blog content here..."
            />
          </div>
        </div>

        <div style={{ ...glassPanelStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>SEO Analysis Score</h4>
          
          {result ? (
            <div>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: 900, 
                color: result.score >= 80 ? '#10a37f' : result.score >= 50 ? '#fbbf24' : '#e50914',
                marginBottom: '20px'
              }}>
                {result.score}/100
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {result.checks.map((check, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                    border: \`1px solid \${check.passed ? 'rgba(16,163,127,0.2)' : 'rgba(229,9,20,0.2)'}\`
                  }}>
                    {check.passed ? <Check color="#10a37f" /> : <X color="#e50914" />}
                    <span style={{ fontSize: '0.9rem', color: check.passed ? 'white' : 'var(--text-dim)' }}>{check.message}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Shield size={48} opacity={0.2} />
              <p>Enter your content and click Analyze to see your SEO score.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SEOManagerPanel;
