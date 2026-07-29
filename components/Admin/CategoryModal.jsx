"use client";
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { X, Save, Image } from '../Common/Icons';

const ImageUpload = ({ url, onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState(url || '');
  const fileInputRef = useRef(null);

  useEffect(() => { setLocalUrl(url || ''); }, [url]);

  const handleUrlBlur = async () => {
    const currentUrl = localUrl.trim();
    if (!currentUrl || currentUrl === url) return;
    if (currentUrl.includes('res.cloudinary.com') || currentUrl.startsWith('data:') || currentUrl.startsWith('/uploads/')) {
      onUpload(currentUrl); return;
    }
    setIsUploading(true);
    try {
      const res = await api.post('/admin/upload_image_url', { url: currentUrl });
      if (res.data && res.data.status === 'success') { onUpload(res.data.imageUrl); }
      else { toast.error(res.data?.error || "Failed to upload from URL"); onUpload(currentUrl); }
    } catch (e) {
      toast.error("Failed to upload from URL (" + e.message + ")"); onUpload(currentUrl);
    } finally { setIsUploading(false); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('image', file);
    try {
      setIsUploading(true);
      const res = await api.post('/admin/upload_image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data && res.data.status === 'success') { onUpload(res.data.imageUrl); }
      else { toast.error(res.data?.error || 'Server rejected the image.'); }
    } catch (error) { toast.error('Upload failed: ' + error.message); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="text" placeholder="https://..." value={localUrl} onChange={(e) => setLocalUrl(e.target.value)} onBlur={handleUrlBlur}
          className="glass-input"
          style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', color: 'white', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
        />
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
          style={{ padding: '0 20px', borderRadius: '12px', background: 'var(--accent-main)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', opacity: isUploading ? 0.7 : 1, whiteSpace: 'nowrap' }}
        >{isUploading ? 'Uploading...' : 'Upload'}</button>
      </div>
      <div style={{ height: '140px', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
        {url ? (
          <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
            <Image size={24} style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Image Preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image_url: ''
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        image_url: category.image_url || ''
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
    if (!formData.name?.trim()) {
      return toast.error("Name is required!");
    }
    try {
      await api.post('/admin/save_category', { ...formData, id: category?.id });
      onSave();
    } catch (error) {
      toast.error("Failed to save AI Type");
    }
  };

  return (
    <div className="glass-overlay" style={{ 
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      padding: '20px'
    }}>
      <div className="glass-modal" style={{ 
        width: '100%', maxWidth: '500px', position: 'relative',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface-1)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Modal Header */}
        <div style={{ 
          padding: '25px 35px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(10,10,12,0.5)', backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.3px', margin: 0, color: 'white' }}>
            {category ? 'Edit AI Type' : 'Create AI Type'}
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.6)', 
              width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.3s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '35px' }}>
          <form id="aiTypeForm" onSubmit={handleSubmit}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                AI Name
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                  setFormData({ ...formData, name, slug: formData.slug === '' || formData.slug === category?.slug ? slug : formData.slug });
                }}
                placeholder="e.g. Midjourney"
                className="glass-input"
                style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
                required 
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                URL Slug
              </label>
              <input 
                type="text" 
                value={formData.slug} 
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
                placeholder="midjourney"
                className="glass-input"
                style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
                required 
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Icon / Image
              </label>
              <ImageUpload url={formData.image_url} onUpload={(url) => setFormData({ ...formData, image_url: url })} />
            </div>
          </form>
        </div>

        <div style={{ padding: '25px 35px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,12,0.5)', backdropFilter: 'blur(10px)', display: 'flex', gap: '15px' }}>
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
            form="aiTypeForm"
            style={{ 
              flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent-main)', 
              color: 'white', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '1rem',
              boxShadow: '0 8px 25px rgba(229, 9, 20, 0.25)'
            }}
          >
            Save AI Type
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
