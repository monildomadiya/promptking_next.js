import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { X, Save, Image, Code, Star, Shield, Zap, Sparkles, Smartphone, PlusCircle, FileText, Activity, CheckCircle, Trash2, Camera } from '../Common/Icons';
import CustomEditor from './CustomEditor';

const ListicleModal = ({ prompt, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    prompt_key: '',
    slug: '',
    title: '',
    website_category_id: '',
    sub_prompts: [],
    thumbnail_url: '',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    faqs: [],
    tags: '',
    description: '',
    ai_type: 'ChatGPT',
    password: '',
    is_premium: false,
    image_ratio: '4 / 5',
    is_image_slider: false,
    gallery_urls: '[]',
    hide_prompt_box: false,
    is_featured: false,
    is_draft: false,
    publish_date: ''
  });
  const [originalKey, setOriginalKey] = useState(null);
  const [categories, setCategories] = useState([]);
  const [websiteCategories, setWebsiteCategories] = useState([]);
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
      const res = await api.post('/admin/upload_image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data && res.data.status === 'success') {
        const url = res.data.imageUrl;
        const existing = (() => { try { return JSON.parse(formData.gallery_urls || '[]'); } catch(err) { return []; } })();
        setFormData(prev => ({ ...prev, gallery_urls: JSON.stringify([...existing, url]) }));
      } else {
        toast.error(res.data?.error || 'Server rejected the gallery image.');
      }
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
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
      if (res.data && res.data.status === 'success') {
        const existing = (() => { try { return JSON.parse(formData.gallery_urls || '[]'); } catch(err) { return []; } })();
        setFormData(prev => ({ ...prev, gallery_urls: JSON.stringify([...existing, res.data.imageUrl]) }));
      } else {
        throw new Error(res.data?.error || "Invalid response");
      }
    } catch (e) {
      toast.error("Failed to upload from URL (" + e.message + "). Falling back to original URL.");
      const existing = (() => { try { return JSON.parse(formData.gallery_urls || '[]'); } catch(err) { return []; } })();
      setFormData(prev => ({ ...prev, gallery_urls: JSON.stringify([...existing, url]) }));
    } finally {
      setIsUploadingGallery(false);
      setGalleryUrl('');
    }
  };

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data));
    api.get('/website_categories').then(res => setWebsiteCategories(res.data));
    if (prompt) {
      let parsedFaqs = [];
      try { parsedFaqs = typeof prompt.faqs === 'string' ? JSON.parse(prompt.faqs) : (prompt.faqs || []); } catch(e) {}

      let parsedSubPrompts = [];
      try { parsedSubPrompts = typeof prompt.sub_prompts === 'string' ? JSON.parse(prompt.sub_prompts) : (prompt.sub_prompts || []); } catch(e) {}

      setFormData({
        ...prompt,
        faqs: parsedFaqs,
        sub_prompts: parsedSubPrompts,
        is_image_slider: Boolean(prompt.is_image_slider),
        is_premium: prompt.is_premium == 1 || prompt.is_premium === true || prompt.is_premium === 'true' || prompt.isPremium == 1 || prompt.isPremium === true || prompt.isPremium === 'true',
        hide_prompt_box: prompt.hide_prompt_box == 1 || prompt.hide_prompt_box === true || prompt.hide_prompt_box === 'true' || prompt.hidePromptBox == 1 || prompt.hidePromptBox === true || prompt.hidePromptBox === 'true',
        is_featured: prompt.is_featured == 1 || prompt.is_featured === true || prompt.is_featured === 'true' || prompt.isFeatured == 1 || prompt.isFeatured === true || prompt.isFeatured === 'true',
        is_draft: prompt.is_draft == 1 || prompt.is_draft === true || prompt.is_draft === 'true',
        publish_date: prompt.publish_date ? new Date(new Date(prompt.publish_date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0,16) : '',
        description: prompt.description || '',
        meta_title: prompt.meta_title || prompt.metaTitle || '',
        meta_description: prompt.meta_description || '',
        focus_keyword: prompt.focus_keyword || '',
        canonical_url: prompt.canonical_url || '',
        og_title: prompt.og_title || '',
        og_description: prompt.og_description || '',
        og_image: prompt.og_image || '',
        twitter_title: prompt.twitter_title || '',
        twitter_description: prompt.twitter_description || '',
        twitter_image: prompt.twitter_image || '',
        tags: typeof prompt.tags === 'string' ? prompt.tags : '',
        gallery_urls: prompt.gallery_urls || prompt.galleryUrls || '[]'
      });
      setOriginalKey(prompt.prompt_key);
    } else {
      const uniqueId = 'PK' + Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, prompt_key: uniqueId }));
    }

    // Esc key to close
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [prompt, onClose]);

  // FAQ helpers
  const addFaq = () => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
  const updateFaq = (index, field, value) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index][field] = value;
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };
  const removeFaq = (index) => {
    const newFaqs = [...formData.faqs];
    newFaqs.splice(index, 1);
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };

  // Sub-Prompt helpers
  const addSubPrompt = () => setFormData(prev => ({ ...prev, sub_prompts: [...(prev.sub_prompts || []), { title: '', prompt_text: '', imgBefore: '', imgAfter: '' }] }));
  const updateSubPrompt = (index, field, value) => {
    const newSubPrompts = [...(formData.sub_prompts || [])];
    newSubPrompts[index][field] = value;
    setFormData(prev => ({ ...prev, sub_prompts: newSubPrompts }));
  };
  const removeSubPrompt = (index) => {
    const newSubPrompts = [...(formData.sub_prompts || [])];
    newSubPrompts.splice(index, 1);
    setFormData(prev => ({ ...prev, sub_prompts: newSubPrompts }));
  };

  // SEO Score
  const getSeoScore = () => {
    let score = 0;
    if (formData.meta_title) score++;
    if (formData.meta_description) score++;
    if (formData.slug) score++;
    if (formData.focus_keyword) score++;
    if (formData.faqs && formData.faqs.length >= 1) score++;
    return score;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      return toast.error("Title is required!");
    }
    try {
      await api.post('/admin/save_prompt', { ...formData, originalKey });
      onSave();
    } catch (error) {
      const msg = error.response?.data?.error || error.message || "Unknown error";
      toast.error(`Failed to save prompt: ${msg}`);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--surface-0)',
      color: 'white'
    }}>
      <style>{`
        .prompt-modal .glass-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          box-sizing: border-box;
          font-family: inherit;
        }
      `}</style>
      <div className="prompt-modal" style={{ 
        width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{ 
          padding: '30px 0 30px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '4px' }}>
              {prompt ? 'Edit Listicle/Blog' : 'Create New Listicle'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              Refine every detail — content, visuals & SEO.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <CheckCircle size={16} color={getSeoScore() >= 4 ? '#4CAF50' : '#FF9800'} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>SEO Score: {getSeoScore()}/5</span>
            </div>
            <button 
              onClick={onClose}
              className="glass-button-secondary"
              style={{ width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '40px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          
          {/* ── LEFT COLUMN ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* 1. Identity & Core */}
            <div>
              <SectionTitle title="1. Identity & Core" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
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

                <div>
                  <Label text="Display Title" />
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      const newSlug = newTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                      setFormData({ ...formData, title: newTitle, slug: newSlug });
                    }}
                    className="glass-input"
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
                    required 
                  />
                </div>

                <div>
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
                  {formData.slug && <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '5px' }}>Preview: /prompt/{formData.prompt_key}</small>}
                </div>

                <div>
                  <Label text="Website Category (For Blog/Listicles)" />
                  <select 
                    value={formData.website_category_id}
                    onChange={(e) => setFormData({ ...formData, website_category_id: e.target.value })}
                    className="glass-input"
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem', appearance: 'none', background: 'var(--surface-1)' }}
                  >
                    <option value="">None</option>
                    {websiteCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Label text="Listicle / Blog Thumbnail (Overrides Image After)" />
                  <ImageUpload url={formData.thumbnail_url} onUpload={(url) => setFormData({ ...formData, thumbnail_url: url })} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <Label text="Tags (comma separated)" />
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="glass-input"
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
                    placeholder="AI portrait, Midjourney, photography style"
                  />
                  <Hint text="Helps with internal search & SEO" />
                </div>
              </div>
            </div>

            {/* 2. SEO Settings */}
            <div>
              <SectionTitle title="2. SEO Settings" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <Label text="SEO Meta Title" />
                  <input 
                    type="text" 
                    value={formData.meta_title} 
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="glass-input"
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
                    placeholder="Custom SEO title (defaults to Display Title if empty)"
                  />
                  <small style={{ color: formData.meta_title.length > 60 ? 'var(--accent-main)' : 'var(--text-dim)', float: 'right', marginTop: '5px' }}>
                    {formData.meta_title.length} / 60
                  </small>
                </div>

                <div>
                  <Label text="Meta Description" />
                  <textarea 
                    value={formData.meta_description} 
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="glass-input"
                    rows={3}
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem', resize: 'vertical' }}
                    placeholder="Short description for search engines (120-160 chars ideal)..."
                  />
                  <small style={{ color: (formData.meta_description.length < 120 && formData.meta_description.length > 0) || formData.meta_description.length > 160 ? 'var(--accent-main)' : 'var(--text-dim)', float: 'right', marginTop: '5px' }}>
                    {formData.meta_description.length} / 160
                  </small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <Label text="Focus Keyword" />
                    <input 
                      type="text" 
                      value={formData.focus_keyword} 
                      onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                      className="glass-input"
                      style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
                      placeholder="e.g. cinematic portrait prompt"
                    />
                  </div>
                  <div>
                    <Label text="Canonical URL" />
                    <input 
                      type="url" 
                      value={formData.canonical_url} 
                      onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                      className="glass-input"
                      style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
                      placeholder="Defaults to this prompt's URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. FAQ Section */}
            <div>
              <SectionTitle title="4. FAQ Section (Boosts SEO)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {formData.faqs.map((faq, index) => (
                  <div key={index} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', position: 'relative' }}>
                    <button 
                      type="button" 
                      onClick={() => removeFaq(index)}
                      style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--accent-main)', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <Label text={`Question ${index + 1}`} />
                    <input 
                      type="text" 
                      value={faq.question} 
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                      className="glass-input"
                      style={{ marginBottom: '15px' }}
                      placeholder="e.g. What AI tool works best with this prompt?"
                    />
                    <Label text="Answer" />
                    <textarea 
                      value={faq.answer} 
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      className="glass-input"
                      rows={2}
                      placeholder="Answer clearly and concisely..."
                    />
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addFaq}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}
                >
                  <PlusCircle size={16} /> Add FAQ
                </button>
              </div>
            </div>

            {/* 4.5. Sub-Prompts (Listicle Builder) */}
            <div>
              <SectionTitle title="4.5. Sub-Prompts (Listicle/Blog Builder)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {(formData.sub_prompts || []).map((sp, index) => (
                  <div key={index} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', position: 'relative' }}>
                    <button 
                      type="button" 
                      onClick={() => removeSubPrompt(index)}
                      style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--accent-main)', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <Label text={`Sub-Prompt ${index + 1} Title`} />
                    <input 
                      type="text" 
                      value={sp.title} 
                      onChange={(e) => updateSubPrompt(index, 'title', e.target.value)}
                      className="glass-input"
                      style={{ marginBottom: '15px', width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}
                      placeholder="e.g. 1. The Classic Cinematic Shot"
                    />
                    <Label text="Sub-Prompt Text" />
                    <textarea 
                      value={sp.prompt_text} 
                      onChange={(e) => updateSubPrompt(index, 'prompt_text', e.target.value)}
                      className="glass-input"
                      style={{ marginBottom: '15px', width: '100%', minHeight: '100px', padding: '14px', borderRadius: '14px', fontSize: '0.95rem', fontFamily: 'monospace' }}
                      placeholder="Enter the prompt here..."
                    />
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <Label text="Before Image (Optional)" />
                        <ImageUpload url={sp.imgBefore} onUpload={(url) => updateSubPrompt(index, 'imgBefore', url)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Label text="After/Result Image" />
                        <ImageUpload url={sp.imgAfter} onUpload={(url) => updateSubPrompt(index, 'imgAfter', url)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addSubPrompt}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}
                >
                  <PlusCircle size={16} /> Add Sub-Prompt
                </button>
              </div>
            </div>

            {/* 5. Detailed Description */}
            <div>
              <SectionTitle title="5. Detailed Description" />
              <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CustomEditor
                  value={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                />
              </div>
            </div>

            <div className="glass-divider" />

            <div style={{ display: 'flex', gap: '20px' }}>
              <button type="button" onClick={onClose} className="glass-button-secondary"
                style={{ flex: 1, padding: '18px', borderRadius: '18px', fontWeight: 700, fontSize: '1rem' }}
              >Discard Changes</button>
              <button type="submit"
                style={{ flex: 2, padding: '18px', borderRadius: '18px', background: 'var(--accent-main)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(229, 9, 20, 0.3)' }}
              >Publish Prompt</button>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Social Sharing — OG */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <SectionTitle title="Social Sharing" />

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'white', marginBottom: '10px' }}>Open Graph (Facebook/LinkedIn)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="OG Title (Fallback: Meta Title)" value={formData.og_title} onChange={(e) => setFormData({ ...formData, og_title: e.target.value })} className="glass-input" style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                  <textarea placeholder="OG Description (Fallback: Meta Desc)" value={formData.og_description} onChange={(e) => setFormData({ ...formData, og_description: e.target.value })} className="glass-input" rows={2} style={{ fontSize: '0.85rem', padding: '10px 14px', resize: 'vertical' }} />
                  <input type="text" placeholder="OG Image URL (Fallback: Hero Image)" value={formData.og_image} onChange={(e) => setFormData({ ...formData, og_image: e.target.value })} className="glass-input" style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'white', marginBottom: '10px' }}>Twitter / X Card</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="Twitter Title (Fallback: OG Title)" value={formData.twitter_title} onChange={(e) => setFormData({ ...formData, twitter_title: e.target.value })} className="glass-input" style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                  <textarea placeholder="Twitter Description" value={formData.twitter_description} onChange={(e) => setFormData({ ...formData, twitter_description: e.target.value })} className="glass-input" rows={2} style={{ fontSize: '0.85rem', padding: '10px 14px', resize: 'vertical' }} />
                  <input type="text" placeholder="Twitter Image URL (Fallback: OG Image)" value={formData.twitter_image} onChange={(e) => setFormData({ ...formData, twitter_image: e.target.value })} className="glass-input" style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                </div>
              </div>
            </div>

            {/* SEO Checklist */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <SectionTitle title="SEO Checklist" />
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <CheckItem checked={!!formData.meta_title} text="Meta title exists" />
                <CheckItem checked={!!formData.meta_description} text="Meta description exists" />
                <CheckItem checked={!!formData.slug} text="Slug exists" />
                <CheckItem checked={!!formData.focus_keyword} text="Focus keyword exists" />
                <CheckItem checked={formData.faqs && formData.faqs.length >= 1} text="At least 1 FAQ added" />
              </ul>

              {/* Score Bar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>SEO Strength</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: getSeoScore() >= 4 ? '#4CAF50' : getSeoScore() >= 2 ? '#FF9800' : 'var(--accent-main)' }}>
                    {getSeoScore() >= 4 ? 'Strong' : getSeoScore() >= 2 ? 'Fair' : 'Weak'}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(getSeoScore() / 5) * 100}%`, 
                    background: getSeoScore() >= 4 ? '#4CAF50' : getSeoScore() >= 2 ? '#FF9800' : 'var(--accent-main)',
                    borderRadius: '10px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const SectionTitle = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-main)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{title}</span>
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

const CheckItem = ({ checked, text }) => (
  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: checked ? '#4CAF50' : 'rgba(255,255,255,0.4)', fontWeight: checked ? 600 : 400 }}>
    <CheckCircle size={14} color={checked ? '#4CAF50' : 'rgba(255,255,255,0.2)'} />
    {text}
  </li>
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
  <button type="button" onClick={onClick}
    style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid', borderColor: active ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)', background: active ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255,255,255,0.02)', color: active ? 'var(--accent-main)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: '0.2s' }}
  >{ratio}</button>
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
          <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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

export default ListicleModal;
