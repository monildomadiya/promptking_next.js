import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { X, Save, Image, Code, Star, Shield, Zap, Sparkles, Smartphone, PlusCircle, FileText, Activity } from '../Common/Icons';
import CustomEditor from './CustomEditor';

const PromptModal = ({ prompt, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    prompt_key: '',
    slug: '',
    title: '',
    description: '',
    ai_type: 'ChatGPT',
    password: '',
    is_premium: false,
    image_ratio: '4 / 5',
    is_image_slider: false,
    gallery_urls: '[]',
    hide_prompt_box: false,
    is_featured: false
  });
  const [originalKey, setOriginalKey] = useState(null);
  const [categories, setCategories] = useState([]);
  const [galleryUrl, setGalleryUrl] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryFileInputRef = useRef(null);

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    try {
      setIsUploadingGallery(true);
      const res = await api.post('/admin/upload_image', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        const url = res.data.imageUrl;
        const existing = (() => { try { return JSON.parse(formData.gallery_urls || '[]'); } catch(err) { return []; } })();
        setFormData(prev => ({ ...prev, gallery_urls: JSON.stringify([...existing, url]) }));
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleAddGalleryUrl = async () => {
    const url = galleryUrl.trim();
    if (!url) return;
    
    if (url.includes('res.cloudinary.com') || url.startsWith('data:') || url.startsWith('/uploads/')) {
      const existing = (() => { try { return JSON.parse(formData.gallery_urls || '[]'); } catch(err) { return []; } })();
      setFormData(prev => ({ ...prev, gallery_urls: JSON.stringify([...existing, url]) }));
      setGalleryUrl('');
      return;
    }

    try {
      setIsUploadingGallery(true);
      const res = await api.post('/admin/upload_image_url', { url });
      if (res.data.status === 'success') {
        const existing = (() => { try { return JSON.parse(formData.gallery_urls || '[]'); } catch(err) { return []; } })();
        setFormData(prev => ({ ...prev, gallery_urls: JSON.stringify([...existing, res.data.imageUrl]) }));
      } else {
        throw new Error();
      }
    } catch (e) {
      alert("Failed to upload from URL. Falling back to original URL.");
      const existing = (() => { try { return JSON.parse(formData.gallery_urls || '[]'); } catch(err) { return []; } })();
      setFormData(prev => ({ ...prev, gallery_urls: JSON.stringify([...existing, url]) }));
    } finally {
      setIsUploadingGallery(false);
      setGalleryUrl('');
    }
  };

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data));
    if (prompt) {
      setFormData({
        ...prompt,
        is_image_slider: Boolean(prompt.is_image_slider),
        is_premium: prompt.is_premium == 1 || prompt.is_premium === true || prompt.is_premium === 'true' || prompt.isPremium == 1 || prompt.isPremium === true || prompt.isPremium === 'true',
        hide_prompt_box: prompt.hide_prompt_box == 1 || prompt.hide_prompt_box === true || prompt.hide_prompt_box === 'true' || prompt.hidePromptBox == 1 || prompt.hidePromptBox === true || prompt.hidePromptBox === 'true',
        is_featured: prompt.is_featured == 1 || prompt.is_featured === true || prompt.is_featured === 'true' || prompt.isFeatured == 1 || prompt.isFeatured === true || prompt.isFeatured === 'true',
        description: prompt.description || '',
        gallery_urls: prompt.gallery_urls || prompt.galleryUrls || '[]'
      });
      setOriginalKey(prompt.prompt_key);
    } else {
      // Auto-generate a unique ID for new prompts (PK + 4 random digits)
      const uniqueId = 'PK' + Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, prompt_key: uniqueId }));
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [prompt, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
 
    // Validation: Premium content MUST have a password
    if (formData.is_premium && (!formData.password || formData.password.trim() === '')) {
      alert("⚠️ SECURITY REQUIRED: Premium content must have an unlock PIN/Password.");
      return;
    }

    try {
      await api.post('/admin/save_prompt', { ...formData, originalKey });
      onSave();
    } catch (error) {
      const msg = error.response?.data?.error || "Failed to save prompt";
      alert(msg);
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
              {prompt ? 'Edit Masterpiece' : 'Create New Prompt'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              Refine every detail of your prompt experience.
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Section: Basic Info */}
            <div style={{ gridColumn: 'span 2' }}>
              <SectionTitle title="Identity & SEO" />
            </div>

            <div style={{ gridColumn: 'span 1' }}>
              <Label text="Prompt Identifier" icon={<Shield size={14} />} />
              <input 
                type="text" 
                placeholder="PK101"
                value={formData.prompt_key} 
                onChange={(e) => {
                  let val = e.target.value.toUpperCase();
                  if (!val.startsWith('PK')) val = 'PK' + val.replace(/[^0-9]/g, '').slice(0, 4);
                  else val = 'PK' + val.slice(2).replace(/[^0-9]/g, '').slice(0, 4);
                  setFormData({ ...formData, prompt_key: val });
                }}
                className="glass-input"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
              />
              <Hint text="Unique ID (e.g. PK001)" />
            </div>

            <div style={{ gridColumn: 'span 1' }}>
              <Label text="Display Title" />
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => {
                  const newTitle = e.target.value;
                  const newSlug = newTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                  setFormData({ ...formData, title: newTitle, slug: formData.slug ? formData.slug : newSlug });
                }}
                className="glass-input"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
                required 
              />
            </div>

            <div style={{ gridColumn: 'span 1' }}>
              <Label text="SEO Slug" />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
                  className="glass-input"
                  style={{ flex: 1, padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
                />
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, slug: formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
                  className="glass-button-secondary"
                  style={{ padding: '0 20px', borderRadius: '14px', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  AUTO
                </button>
              </div>
            </div>

            <div style={{ gridColumn: 'span 1' }}>
              <Label text="AI Category" />
              <select 
                value={formData.ai_type}
                onChange={(e) => setFormData({ ...formData, ai_type: e.target.value })}
                className="glass-input"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem', appearance: 'none' }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Section: Rich Content */}
            <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <SectionTitle title="Experience Content" />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <Label text="Detailed Description" />
              <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CustomEditor
                  value={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <Label text="Raw Prompt Machine Source" icon={<Zap size={14} />} />
              <textarea 
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                className="glass-input"
                style={{ width: '100%', minHeight: '180px', padding: '20px', borderRadius: '18px', fontSize: '0.95rem', fontFamily: 'monospace', lineHeight: '1.6' }}
                required
              />
            </div>

            {/* Section: Visuals */}
            <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <SectionTitle title="Visual Engineering" />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div className="glass-card" style={{ padding: '25px', borderRadius: '20px' }}>
                <Label text="Presentation Mode" />
                <div style={{ display: 'flex', gap: '30px', marginTop: '15px', flexWrap: 'wrap' }}>
                  <Checkbox label="Enable Contrast Slider" checked={formData.is_image_slider} onChange={(val) => setFormData({...formData, is_image_slider: val})} />
                  <Checkbox label="Premium Content" premium checked={formData.is_premium} onChange={(val) => setFormData({...formData, is_premium: val, password: val ? formData.password : ''})} />
                  <Checkbox label="Hide Prompt from Users" checked={formData.hide_prompt_box} onChange={(val) => setFormData({...formData, hide_prompt_box: val})} />
                  <Checkbox label="Feature Prompt" checked={formData.is_featured} onChange={(val) => setFormData({...formData, is_featured: val})} />
                </div>
              </div>
            </div>

            <div style={{ gridColumn: 'span 1' }}>
              <Label text="Hero Image (Result)" />
              <ImageUpload 
                url={formData.img_after} 
                onUpload={(url) => setFormData({ ...formData, img_after: url })} 
              />
            </div>

            <div style={{ gridColumn: 'span 1' }}>
              <Label text={formData.is_image_slider ? 'Comparison Image (Before)' : 'Secondary Image'} />
              <ImageUpload 
                url={formData.img_before} 
                onUpload={(url) => setFormData({ ...formData, img_before: url })} 
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <Label text="Aspect Ratio Configuration" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
                {['1 / 1', '16 / 9', '4 / 5', '21 / 9', '4 / 3'].map(ratio => (
                  <RatioButton 
                    key={ratio} 
                    ratio={ratio} 
                    active={formData.image_ratio === ratio} 
                    onClick={() => setFormData({ ...formData, image_ratio: ratio })} 
                  />
                ))}
                <input 
                  type="text" 
                  placeholder="Custom (e.g. 3 / 2)"
                  value={formData.image_ratio}
                  onChange={(e) => setFormData({ ...formData, image_ratio: e.target.value })}
                  className="glass-input"
                  style={{ width: '150px', padding: '10px 15px', borderRadius: '10px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <Label text="Gallery Images (Optional)" icon={<Image size={14} />} />

              {/* URL Input Row */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Paste image URL here..."
                  value={galleryUrl}
                  onChange={(e) => setGalleryUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGalleryUrl();
                    }
                  }}
                  className="glass-input"
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  disabled={isUploadingGallery}
                  style={{
                    padding: '12px 20px', borderRadius: '12px', background: 'var(--accent-main)',
                    color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    whiteSpace: 'nowrap', opacity: isUploadingGallery ? 0.7 : 1
                  }}
                >+ Add URL</button>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={galleryFileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleGalleryUpload} 
                />
                <button
                  type="button"
                  onClick={() => galleryFileInputRef.current?.click()}
                  disabled={isUploadingGallery}
                  style={{
                    padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)',
                    color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    whiteSpace: 'nowrap', opacity: isUploadingGallery ? 0.7 : 1
                  }}
                >
                  {isUploadingGallery ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>

              {/* Added URLs List */}
              {(() => {
                let imgs = [];
                try { imgs = JSON.parse(formData.gallery_urls || '[]'); } catch(e) {}
                if (!Array.isArray(imgs) || imgs.length === 0) {
                  return <Hint text="No gallery images yet. Paste a URL above and click + Add." />;
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {imgs.map((url, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.06)', padding: '8px 12px'
                      }}>
                        <img src={url} alt={`img ${idx+1}`} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, background: '#111' }} onError={e => e.target.style.display='none'} />
                        <span style={{ flex: 1, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = imgs.filter((_, i) => i !== idx);
                            setFormData({ ...formData, gallery_urls: JSON.stringify(updated) });
                          }}
                          style={{
                            background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)',
                            color: 'var(--accent-main)', width: '26px', height: '26px', borderRadius: '6px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', flexShrink: 0
                          }}
                        >✕</button>
                      </div>
                    ))}
                    <Hint text={`${imgs.length} image${imgs.length > 1 ? 's' : ''} added to gallery.`} />
                  </div>
                );
              })()}
            </div>

            {/* Section: Security */}
            <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <SectionTitle title="Access & Monetization" />
            </div>

            {formData.is_premium && (
              <div style={{ gridColumn: 'span 1' }}>
                <Label text="Unlock PIN Code" />
                <input 
                  type="text" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="glass-input"
                  placeholder="4-8 Digit PIN"
                  style={{ width: '100%', padding: '14px', borderRadius: '14px' }}
                />
              </div>
            )}

            <div style={{ gridColumn: 'span 1' }}>
              <Label text="Monetization URL (YT Shorts)" />
              <input 
                type="text" 
                placeholder="https://youtube.com/shorts/..."
                value={formData.ig_link}
                onChange={(e) => setFormData({ ...formData, ig_link: e.target.value })}
                className="glass-input"
                style={{ width: '100%', padding: '14px', borderRadius: '14px' }}
              />
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
              Discard Changes
            </button>
            <button 
              type="submit" 
              style={{ 
                flex: 2, padding: '18px', borderRadius: '18px', background: 'var(--accent-main)', 
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem',
                boxShadow: '0 10px 30px rgba(229, 9, 20, 0.3)'
              }}
            >
              Publish Prompt
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
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
    {icon} {text}
  </label>
);

const Hint = ({ text }) => (
  <small style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>{text}</small>
);

const Checkbox = ({ label, checked, onChange, premium }) => (
  <label
    onClick={(e) => { e.preventDefault(); onChange(!checked); }}
    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: premium ? '#FFC107' : 'white', userSelect: 'none' }}
  >
    <div style={{ position: 'relative', width: '22px', height: '22px', borderRadius: '6px', border: `2px solid ${checked ? (premium ? '#FFC107' : 'var(--accent-main)') : 'rgba(255,255,255,0.2)'}`, background: checked ? (premium ? 'rgba(255,193,7,0.1)' : 'rgba(229,9,20,0.1)') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', flexShrink: 0 }}>
      {checked && <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: premium ? '#FFC107' : 'var(--accent-main)' }} />}
    </div>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} readOnly />
    {label}
  </label>
);

const RatioButton = ({ ratio, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '8px 16px', borderRadius: '10px', border: '1px solid',
      borderColor: active ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)',
      background: active ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255,255,255,0.02)',
      color: active ? 'var(--accent-main)' : 'rgba(255,255,255,0.6)',
      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: '0.2s'
    }}
  >
    {ratio}
  </button>
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
      alert("Failed to upload from URL");
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
      alert('Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="https://..."
          value={localUrl}
          onChange={(e) => setLocalUrl(e.target.value)}
          onBlur={handleUrlBlur}
          className="glass-input"
          style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', color: 'white', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
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
            padding: '0 20px', borderRadius: '12px', background: 'var(--accent-main)',
            color: 'white', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            opacity: isUploading ? 0.7 : 1, whiteSpace: 'nowrap'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <div style={{ 
        height: '140px', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)', overflow: 'hidden'
      }}>
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

export default PromptModal;
