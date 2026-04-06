import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Save, PlusCircle, Activity } from '../Common/Icons';

const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug
      });
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [category, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/save_category', { ...formData, id: category?.id });
      onSave();
    } catch (error) {
      alert("Failed to save category");
    }
  };

  return (
    <div className="glass-overlay" style={{ 
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      padding: '20px'
    }}>
      <div className="glass-modal" style={{ 
        width: '100%', maxWidth: '550px', position: 'relative',
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
              {category ? 'Edit Category' : 'New Category'}
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
              Category Name
            </label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                setFormData({ name, slug: formData.slug === '' || formData.slug === category?.slug ? slug : formData.slug });
              }}
              placeholder="e.g. Midjourney Excellence"
              className="glass-input"
              style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
              required 
            />
          </div>

          <div style={{ marginBottom: '35px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              URL Identity (Slug)
            </label>
            <input 
              type="text" 
              value={formData.slug} 
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
              placeholder="midjourney-excellence"
              className="glass-input"
              style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
              required 
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
              Save Architecture
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
