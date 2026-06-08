import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { X, Image, Sparkles, PlusCircle, FileText, Save, Activity, Camera, Trash2, CheckCircle } from '../Common/Icons';
import CustomEditor from './CustomEditor';

const BlogModal = ({ blog, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    slug: '',
    category: '',
    tags: [],
    excerpt: '',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    canonical_url: '',
    featured_image: '',
    featured_image_alt: '',
    featured_image_caption: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    content: '',
    enable_table_of_contents: true,
    faqs: [],
    author_name: '',
    status: 'published',
    read_time: ''
  });

  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (blog) {
      let parsedTags = [];
      try { parsedTags = typeof blog.tags === 'string' ? JSON.parse(blog.tags) : (blog.tags || []); } catch(e) {}
      
      let parsedFaqs = [];
      try { parsedFaqs = typeof blog.faqs === 'string' ? JSON.parse(blog.faqs) : (blog.faqs || []); } catch(e) {}

      setFormData({
        id: blog.id,
        title: blog.title || '',
        slug: blog.slug || '',
        category: blog.category || '',
        tags: parsedTags,
        excerpt: blog.excerpt || '',
        meta_title: blog.meta_title || '',
        meta_description: blog.meta_description || '',
        focus_keyword: blog.focus_keyword || '',
        canonical_url: blog.canonical_url || '',
        featured_image: blog.featured_image || '',
        featured_image_alt: blog.featured_image_alt || '',
        featured_image_caption: blog.featured_image_caption || '',
        og_title: blog.og_title || '',
        og_description: blog.og_description || '',
        og_image: blog.og_image || '',
        twitter_title: blog.twitter_title || '',
        twitter_description: blog.twitter_description || '',
        twitter_image: blog.twitter_image || '',
        content: blog.content || '',
        enable_table_of_contents: blog.enable_table_of_contents !== false,
        faqs: parsedFaqs,
        author_name: blog.author_name || '',
        status: blog.status || 'published',
        read_time: blog.read_time || ''
      });
      setTagsInput(parsedTags.join(', '));
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [blog, onClose]);

  // Auto-generate slug and read time
  useEffect(() => {
    if (!blog?.slug && formData.title && !formData.slug) {
      const generatedSlug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title]);

  useEffect(() => {
    if (formData.content) {
      const text = formData.content.replace(/<[^>]*>?/gm, '');
      const words = text.trim().split(/\s+/).length;
      const readTime = Math.ceil(words / 200);
      setFormData(prev => ({ ...prev, read_time: `${readTime} min read` }));
    }
  }, [formData.content]);

  const handleTagsChange = (e) => {
    setTagsInput(e.target.value);
    const tagsArray = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  const addFaq = () => {
    setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
  };

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

  const getSeoScore = () => {
    let score = 0;
    if (formData.meta_title) score++;
    if (formData.meta_description) score++;
    if (formData.slug) score++;
    if (formData.focus_keyword) score++;
    if (formData.featured_image_alt) score++;
    if (formData.content.includes('<h2')) score++;
    if (formData.faqs.length >= 2) score++;
    
    const wordCount = formData.content.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).length;
    if (wordCount >= 800) score++;

    return score;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Headline is required");
    if (!formData.slug) return toast.error("Slug is required");
    if (!formData.content) return toast.error("Content is required");
    if (formData.featured_image && !formData.featured_image_alt) {
      return toast.error("Featured Image Alt Text is required if image exists");
    }

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
        width: '100%', maxWidth: '1200px', maxHeight: '95vh', overflowY: 'auto', position: 'relative',
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
              Optimize for SEO and craft a compelling story.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <CheckCircle size={16} color={getSeoScore() >= 6 ? '#4CAF50' : '#FF9800'} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>SEO Score: {getSeoScore()}/8</span>
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
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* 1. Core Publication Details */}
            <div>
              <SectionTitle title="1. Core Publication Details" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <Label text="Article Headline *" />
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
                <div>
                  <Label text="URL Slug *" />
                  <input 
                    type="text" 
                    value={formData.slug} 
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="glass-input"
                    placeholder="best-ai-image-generator-2026"
                    required 
                  />
                  {formData.slug && <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '5px' }}>Preview: /article/{formData.slug}</small>}
                </div>
                <div>
                  <Label text="Category" />
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="glass-input"
                    list="categories"
                    placeholder="e.g. AI Tools"
                  />
                  <datalist id="categories">
                    <option value="AI Tools" />
                    <option value="AI Image Prompts" />
                    <option value="AI Tutorials" />
                    <option value="AI Reviews" />
                  </datalist>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <Label text="Tags (comma separated)" />
                  <input 
                    type="text" 
                    value={tagsInput} 
                    onChange={handleTagsChange}
                    className="glass-input"
                    placeholder="AI Tools, Midjourney, Reviews"
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <Label text="Article Excerpt (Short Summary)" />
                  <textarea 
                    value={formData.excerpt} 
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="glass-input"
                    rows={3}
                    placeholder="Short summary for blog cards and previews (120-180 chars)..."
                  />
                  <small style={{ color: formData.excerpt.length > 180 ? 'var(--accent-main)' : 'var(--text-dim)', float: 'right', marginTop: '5px' }}>
                    {formData.excerpt.length} / 180
                  </small>
                </div>
              </div>
            </div>

            {/* 2. SEO Settings */}
            <div>
              <SectionTitle title="2. SEO Settings" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div>
                  <Label text="SEO Meta Title" />
                  <input 
                    type="text" 
                    value={formData.meta_title} 
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="glass-input"
                    placeholder="Defaults to Article Headline if empty"
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
                    placeholder="Defaults to Excerpt if empty"
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
                      placeholder="e.g. best AI image generator 2026"
                    />
                  </div>
                  <div>
                    <Label text="Canonical URL" />
                    <input 
                      type="url" 
                      value={formData.canonical_url} 
                      onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                      className="glass-input"
                      placeholder="Defaults to this article's URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Featured Image */}
            <div>
              <SectionTitle title="3. Featured Image" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <ImageUpload 
                  url={formData.featured_image} 
                  onUpload={(url) => setFormData({ ...formData, featured_image: url })} 
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <Label text={`Featured Image Alt Text ${formData.featured_image ? '*' : ''}`} />
                    <input 
                      type="text" 
                      value={formData.featured_image_alt} 
                      onChange={(e) => setFormData({ ...formData, featured_image_alt: e.target.value })}
                      className="glass-input"
                      placeholder="Describe the image for SEO..."
                    />
                  </div>
                  <div>
                    <Label text="Featured Image Caption" />
                    <input 
                      type="text" 
                      value={formData.featured_image_caption} 
                      onChange={(e) => setFormData({ ...formData, featured_image_caption: e.target.value })}
                      className="glass-input"
                      placeholder="Optional caption below image"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Story Canvas */}
            <div>
              <SectionTitle title="5. Story Canvas" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input 
                  type="checkbox" 
                  id="enableTOC"
                  checked={formData.enable_table_of_contents}
                  onChange={(e) => setFormData({ ...formData, enable_table_of_contents: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-main)' }}
                />
                <label htmlFor="enableTOC" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Enable Table of Contents (Auto-generated from H2/H3)</label>
              </div>
              <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                <CustomEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>
            </div>

            {/* 6. FAQ Section */}
            <div>
              <SectionTitle title="6. FAQ Section" />
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
                      placeholder="e.g. Is this AI generator free?"
                    />
                    <Label text="Answer" />
                    <textarea 
                      value={faq.answer} 
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      className="glass-input"
                      rows={2}
                      placeholder="Answer the question clearly..."
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

            <div className="glass-divider" />

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
                Save & {formData.status === 'published' ? 'Publish' : 'Draft'}
              </button>
            </div>

          </div>

          {/* Right Sidebar for Meta Info & Settings */}
          <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '30px', position: 'sticky', top: '100px' }}>
            
            {/* 7. Publishing Settings */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <SectionTitle title="7. Publishing Settings" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <Label text="Status" />
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="glass-input"
                  >
                    <option value="draft" style={{ background: '#1a1a1f' }}>Draft</option>
                    <option value="published" style={{ background: '#1a1a1f' }}>Published</option>
                  </select>
                </div>
                <div>
                  <Label text="Author" />
                  <input 
                    type="text" 
                    value={formData.author_name} 
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    className="glass-input"
                    placeholder="e.g. PromptKing Admin"
                  />
                </div>
                <div>
                  <Label text="Read Time (Auto)" />
                  <input 
                    type="text" 
                    value={formData.read_time} 
                    readOnly
                    className="glass-input"
                    style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-dim)' }}
                  />
                </div>
              </div>
            </div>

            {/* 4. Social Sharing */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <SectionTitle title="4. Social Sharing" />
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'white', marginBottom: '10px' }}>Open Graph (Facebook/LinkedIn)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="OG Title (Fallback: Meta Title)" value={formData.og_title} onChange={(e) => setFormData({ ...formData, og_title: e.target.value })} className="glass-input" style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                  <textarea placeholder="OG Description (Fallback: Meta Desc)" value={formData.og_description} onChange={(e) => setFormData({ ...formData, og_description: e.target.value })} className="glass-input" rows={2} style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                  <input type="text" placeholder="OG Image URL (Fallback: Featured)" value={formData.og_image} onChange={(e) => setFormData({ ...formData, og_image: e.target.value })} className="glass-input" style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'white', marginBottom: '10px' }}>Twitter / X Card</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="Twitter Title (Fallback: OG Title)" value={formData.twitter_title} onChange={(e) => setFormData({ ...formData, twitter_title: e.target.value })} className="glass-input" style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                  <textarea placeholder="Twitter Description (Fallback: OG Desc)" value={formData.twitter_description} onChange={(e) => setFormData({ ...formData, twitter_description: e.target.value })} className="glass-input" rows={2} style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                  <input type="text" placeholder="Twitter Image URL (Fallback: OG Image)" value={formData.twitter_image} onChange={(e) => setFormData({ ...formData, twitter_image: e.target.value })} className="glass-input" style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                </div>
              </div>
            </div>

            {/* SEO Checklist Panel */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <SectionTitle title="SEO Checklist" />
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <CheckItem checked={!!formData.meta_title} text="Meta title exists" />
                <CheckItem checked={!!formData.meta_description} text="Meta description exists" />
                <CheckItem checked={!!formData.slug} text="Slug exists" />
                <CheckItem checked={!!formData.focus_keyword} text="Focus keyword exists" />
                <CheckItem checked={!!formData.featured_image_alt} text="Featured image alt exists" />
                <CheckItem checked={formData.content.includes('<h2')} text="At least one H2 exists" />
                <CheckItem checked={formData.faqs.length >= 2} text="Has at least 2 FAQs" />
                <CheckItem checked={formData.content.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).length >= 800} text="800+ words in content" />
              </ul>
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
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
    {icon} {text}
  </label>
);

const CheckItem = ({ checked, text }) => (
  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: checked ? '#4CAF50' : 'rgba(255,255,255,0.4)', fontWeight: checked ? 600 : 400 }}>
    <CheckCircle size={14} color={checked ? '#4CAF50' : 'rgba(255,255,255,0.2)'} />
    {text}
  </li>
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
