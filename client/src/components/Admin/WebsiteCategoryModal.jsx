import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { X, Save, PlusCircle, Activity, Image } from '../Common/Icons';

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

const WebsiteCategoryModal = ({ category, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image_url: '',
    description: '',
    tag: '',
    meta_title: '',
    meta_description: '',
    focus_keyword: ''
  });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        image_url: category.image_url || '',
        description: category.description || '',
        tag: category.tag || '',
        meta_title: category.meta_title || '',
        meta_description: category.meta_description || '',
        focus_keyword: category.focus_keyword || ''
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
    if (isSaving) return;
    if (!formData.name?.trim()) {
      return toast.error("Category Name is required!");
    }
    setIsSaving(true);
    try {
      await api.post('/admin/save_website_category', { ...formData, id: category?.id });
      onSave();
    } catch (error) {
      toast.error("Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-overlay" style={{ 
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      padding: '20px'
    }}>
      <div className="glass-modal" style={{ 
        width: '100%', maxWidth: '700px', maxHeight: '90vh', position: 'relative',
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

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          {['general', 'seo'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '15px', background: 'none', border: 'none',
                color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.5)',
                fontWeight: activeTab === tab ? 800 : 600,
                borderBottom: activeTab === tab ? '2px solid var(--accent-main)' : '2px solid transparent',
                cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1, padding: '35px' }}>
          <form id="categoryForm" onSubmit={handleSubmit}>
            
            {activeTab === 'general' && (
              <>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Category Name
                    </label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                        setFormData({ ...formData, name, slug: formData.slug === '' || formData.slug === category?.slug ? slug : formData.slug });
                      }}
                      placeholder="e.g. Midjourney Excellence"
                      className="glass-input"
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
                      required 
                    />
                  </div>

                  <div style={{ flex: 1 }}>
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
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Category Tag (e.g. "Trending Prompt")
                  </label>
                  <input 
                    type="text" 
                    value={formData.tag} 
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="Trending Prompt"
                    className="glass-input"
                    style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Description
                  </label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Generate stylish trending images for social media..."
                    className="glass-input"
                    style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem', minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Category Thumbnail (Vertical Image Recommended)
                  </label>
                  <ImageUpload url={formData.image_url} onUpload={(url) => setFormData({ ...formData, image_url: url })} />
                </div>
              </>
            )}

            {activeTab === 'seo' && (
              <>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Meta Title (SEO)
                  </label>
                  <input 
                    type="text" 
                    value={formData.meta_title} 
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Best Couple Photo Prompts for Midjourney"
                    className="glass-input"
                    style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Focus Keyword (SEO)
                  </label>
                  <input 
                    type="text" 
                    value={formData.focus_keyword} 
                    onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                    placeholder="couple photo prompt, midjourney wedding"
                    className="glass-input"
                    style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Meta Description (SEO)
                  </label>
                  <textarea 
                    value={formData.meta_description} 
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Discover the best couple photo prompts to generate cinematic AI images..."
                    className="glass-input"
                    style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', fontSize: '0.95rem', minHeight: '100px', resize: 'vertical' }}
                  />
                </div>
              </>
            )}

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
            form="categoryForm"
            disabled={isSaving}
            style={{ 
              flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent-main)', 
              color: 'white', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 900, fontSize: '1rem',
              boxShadow: '0 8px 25px rgba(229, 9, 20, 0.25)',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Architecture'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteCategoryModal;
