import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { X, Image, Sparkles, PlusCircle, FileText, Save, Activity, Camera } from '../Common/Icons';
import CustomEditor from './CustomEditor';

const BlogModal = ({ blog, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    featured_image: '',
    content: ''
  });

  useEffect(() => {
    if (blog) {
      setFormData({
        id: blog.id,
        title: blog.title || '',
        featured_image: blog.featured_image || '',
        content: blog.content || ''
      });
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [blog, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/save_blog', formData);
      onSave();
    } catch (error) {
      toast.error("Failed to save blog");
    }
  };

  return (
    <div className="glass-overlay" style={{ 
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
      padding: '20px'
    }}>
      <div className="glass-modal" style={{ 
        width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', position: 'relative',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{ 
          padding: '30px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(20px)', zIndex: 10
        }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '4px' }}>
              {blog ? 'Edit Article' : 'Draft New Article'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              Craft a compelling story for your audience.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="glass-button-secondary"
            style={{ width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <SectionTitle title="Core Publication Details" />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <Label text="Article Headline" />
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="glass-input"
                  style={{ width: '100%', padding: '16px', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 600 }}
                  placeholder="Enter a captivating title..."
                  required 
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <Label text="Visual Masterpiece (Featured Image)" />
                <ImageUpload 
                  url={formData.featured_image} 
                  onUpload={(url) => setFormData({ ...formData, featured_image: url })} 
                />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <SectionTitle title="Story Canvas" />
              <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginTop: '20px', display: 'flex', flexDirection: 'column' }}>
                <CustomEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>
            </div>

          </div>

          <div className="glass-divider" style={{ margin: '40px 0' }} />

          <div style={{ display: 'flex', gap: '20px' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="glass-button-secondary"
              style={{ flex: 1, padding: '18px', borderRadius: '18px', fontWeight: 700, fontSize: '1rem' }}
            >
              Discard Draft
            </button>
            <button 
              type="submit" 
              style={{ 
                flex: 2, padding: '18px', borderRadius: '18px', background: 'var(--accent-main)', 
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem',
                boxShadow: '0 10px 30px rgba(229, 9, 20, 0.3)'
              }}
            >
              Publish Article
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const SectionTitle = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-main)', textTransform: 'uppercase', letterSpacing: '2px', whiteSpace: 'nowrap' }}>{title}</span>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(229,9,20,0.3), transparent)' }} />
  </div>
);

const Label = ({ text, icon }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
    {icon} {text}
  </label>
);

const ImageUpload = ({ url, onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState(url || '');
  const fileInputRef = useRef(null);

  useEffect(() => { setLocalUrl(url || ''); }, [url]);

  const handleUrlBlur = async () => {
    const currentUrl = localUrl.trim();
    if (!currentUrl || currentUrl === url) return;
    if (currentUrl.includes('res.cloudinary.com') || currentUrl.startsWith('data:') || currentUrl.startsWith('/uploads/')) {
       onUpload(currentUrl);
       return;
    }
    
    setIsUploading(true);
    try {
      const res = await api.post('/admin/upload_image_url', { url: currentUrl });
      if (res.data.status === 'success') {
         onUpload(res.data.imageUrl);
      } else {
         onUpload(currentUrl);
      }
    } catch (e) {
      toast.error("Failed to upload from URL");
      onUpload(currentUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsUploading(true);
      const res = await api.post('/admin/upload_image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        onUpload(res.data.imageUrl);
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="https://..."
          value={localUrl}
          onChange={(e) => setLocalUrl(e.target.value)}
          onBlur={handleUrlBlur}
          className="glass-input"
          style={{ flex: 1, padding: '14px 18px', borderRadius: '14px', fontSize: '0.9rem', color: 'white', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            padding: '0 20px', borderRadius: '14px', background: 'var(--accent-main)',
            color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            opacity: isUploading ? 0.7 : 1, whiteSpace: 'nowrap'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <div style={{ 
        height: '240px', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)', overflow: 'hidden'
      }}>
        {url ? (
          <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
            <Camera size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Image Preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogModal;
