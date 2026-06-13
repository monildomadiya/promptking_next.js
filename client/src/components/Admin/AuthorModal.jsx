import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X } from '../Common/Icons';

const AuthorModal = ({ author, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: ''
  });

  useEffect(() => {
    if (author) {
      setFormData({
        name: author.name || '',
        image: author.image || '',
        description: author.description || ''
      });
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [author, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      return toast.error("Author Name is required!");
    }
    try {
      await api.post('/admin/save_author', { ...formData, id: author?.id });
      onSave();
    } catch (error) {
      toast.error("Failed to save author");
    }
  };

  return (
    <div className="glass-overlay" style={{ 
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      padding: '20px'
    }}>
      <div className="glass-modal" style={{ 
        width: '100%', maxWidth: '600px', position: 'relative',
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
              {author ? 'Edit Author' : 'New Author'}
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
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Author Name
            </label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. PromptKing Admin"
              className="glass-input"
              style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
              required 
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Image URL
            </label>
            <input 
              type="text" 
              value={formData.image} 
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              className="glass-input"
              style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ marginBottom: '35px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Bio Description
            </label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Passionate about AI..."
              className="glass-input"
              style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem', minHeight: '100px' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="glass-button-secondary"
              style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem' }}
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
              Save Author
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthorModal;
