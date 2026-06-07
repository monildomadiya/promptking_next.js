import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { X, Save, Sparkle } from '../Common/Icons';
import api from '../../api';

const FAQModal = ({ faq, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General'
  });

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        category: faq.category || 'General'
      });
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [faq, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/save_faq', {
        ...formData,
        id: faq ? faq.id : null
      });
      onSave();
    } catch (error) {
      toast.error("Failed to save FAQ");
    }
  };

  return (
    <div className="glass-overlay" style={{ 
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      padding: '20px'
    }}>
      <div className="glass-modal" style={{ 
        width: '100%', maxWidth: '650px', position: 'relative',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{ 
          padding: '25px 35px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(10,10,12,0.5)', backdropFilter: 'blur(10px)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
              {faq ? 'Edit Knowledge' : 'New Knowledge Entry'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="glass-button-secondary"
            style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '35px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            

            <div>
              <label style={labelStyle}>Inquiry Prompt (Question)</label>
              <input 
                type="text" 
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="glass-input"
                style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '1rem', fontWeight: 600 }}
                placeholder="What would users ask?"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Resolution (Answer)</label>
              <textarea 
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="glass-input"
                style={{ width: '100%', height: '180px', padding: '14px 18px', borderRadius: '15px', resize: 'none', lineHeight: '1.6' }}
                placeholder="Provide a detailed and helpful response..."
                required
              />
            </div>

          </div>
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '35px' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="glass-button-secondary"
              style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 700 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ 
                flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent-main)', 
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '1rem',
                boxShadow: '0 8px 25px rgba(229, 9, 20, 0.25)'
              }}
            >
              {faq ? 'Commit Changes' : 'Publish to Help Desk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block', marginBottom: '10px', fontSize: '0.8rem',
  color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px'
};

export default FAQModal;
