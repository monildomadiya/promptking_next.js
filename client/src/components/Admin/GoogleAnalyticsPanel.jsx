import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Save, Info, AlertTriangle, CheckCircle, ArrowRight } from '../Common/Icons';
import api from '../../api';

const GoogleAnalyticsPanel = ({ propertyId = "531615609" }) => {
  const [jsonKey, setJsonKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSave = async () => {
    if (!jsonKey.trim()) {
      setStatus({ type: 'error', message: 'Please paste your Service Account JSON.' });
      return;
    }
    
    try {
      // Basic validation to check if it's JSON
      JSON.parse(jsonKey);
    } catch(e) {
      setStatus({ type: 'error', message: 'Invalid JSON format. Please copy exactly from the downloaded file.' });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      await api.post('/admin/ga_config', { jsonKey });
      setStatus({ type: 'success', message: 'Authentication Successful! Google Analytics is connecting...' });
      setTimeout(() => window.location.reload(), 2000); // Reload to activate live data view (future)
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  const panelStyle = {
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '24px',
    padding: '32px',
    color: 'white',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
  };

  const inputStyle = {
    width: '100%',
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'monospace',
    minHeight: '200px',
    resize: 'vertical'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #fbbc05, #ea4335, #4285f4, #34a853)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(66, 133, 244, 0.3)' }}>
          <PieChart size={32} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Google Analytics (GA4)</h1>
          <p style={{ color: 'var(--text-dim)', margin: '4px 0 0 0', fontSize: '1rem', fontWeight: 500 }}>Property ID: <strong style={{ color: 'white' }}>{propertyId}</strong></p>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ background: 'rgba(234, 67, 53, 0.1)', padding: '10px', borderRadius: '12px', color: '#ea4335' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Connection Required</h3>
            <p style={{ color: 'var(--text-dim)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Google requires strict authentication to pull your live analytics data directly into PromptKing.</p>
          </div>
        </div>

        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--accent-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} /> How to get your Service Account JSON Key:
        </h4>
        
        <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
          {[
            "Go to Google Cloud Console and create a new project (or select an existing one).",
            "Enable the 'Google Analytics Data API' for your project.",
            "Create a 'Service Account' and generate a new JSON key. Download it to your computer.",
            "Important: Go to your Google Analytics Property Access Management and add the Service Account's email address as a 'Viewer'.",
            "Open the downloaded JSON file, copy all its text, and paste it below!"
          ].map((step, idx) => (
            <motion.div key={idx} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                {idx + 1}
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', lineHeight: '1.5' }}>{step}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            value={jsonKey}
            onChange={(e) => setJsonKey(e.target.value)}
            placeholder='{\n  "type": "service_account",\n  "project_id": "your-project",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----...",\n  "client_email": "...",\n  ...\n}'
            style={inputStyle}
          />
        </div>

        {status && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: status.type === 'error' ? 'rgba(229, 9, 20, 0.1)' : 'rgba(16, 163, 127, 0.1)', color: status.type === 'error' ? '#ef4444' : '#10a37f', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
            {status.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            {status.message}
          </motion.div>
        )}

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #4285f4, #34a853)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(66, 133, 244, 0.3)',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'CONNECTING...' : 'CONNECT GOOGLE ANALYTICS'}
            {!isSaving && <ArrowRight size={20} />}
          </motion.button>
        </div>
      </div>
      
    </motion.div>
  );
};

export default GoogleAnalyticsPanel;
