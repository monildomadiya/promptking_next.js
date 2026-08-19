"use client";
import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { X, Save, Image as ImageIcon, AlertTriangle, Smartphone, Monitor } from '../Common/Icons';

// What a source file needs to survive the crops offered on the public page.
// Below this, Cloudinary upscales and the "2560 × 1440" button quietly ships a
// soft image — so the warning belongs here, at upload time, where it can still
// be fixed by choosing a better file.
const RECOMMENDED_MIN_WIDTH = 1440;
const RECOMMENDED_MIN_HEIGHT = 1920;

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem',
  color: 'white', background: 'var(--surface-1)', border: '1px solid var(--border-color)',
  outline: 'none',
};

const labelStyle = {
  display: 'block', marginBottom: '7px', fontSize: '0.72rem',
  fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

/**
 * Upload widget that also reports the image's true pixel dimensions.
 *
 * Those dimensions are the whole point: they get stored on the row (so the
 * public page can state a real size and the ImageObject schema is honest) and
 * they drive the low-resolution warning.
 */
const WallpaperUpload = ({ url, onUpload, onDimensions }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState(url || '');
  const fileInputRef = useRef(null);

  useEffect(() => { setLocalUrl(url || ''); }, [url]);

  // Measured from the delivered image rather than the local file, so a URL
  // paste is measured the same way an upload is.
  const measure = (src) => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => onDimensions?.({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => onDimensions?.(null);
    img.src = src;
  };

  const accept = (imageUrl) => { onUpload(imageUrl); measure(imageUrl); };

  const handleUrlBlur = async () => {
    const currentUrl = localUrl.trim();
    if (!currentUrl || currentUrl === url) return;
    if (currentUrl.includes('res.cloudinary.com') || currentUrl.startsWith('/uploads/')) {
      accept(currentUrl); return;
    }
    setIsUploading(true);
    try {
      const res = await api.post('/admin/upload_image_url', { url: currentUrl });
      if (res.data?.status === 'success') accept(res.data.imageUrl);
      else { toast.error(res.data?.error || 'Failed to upload from URL'); accept(currentUrl); }
    } catch (e) {
      toast.error('Failed to upload from URL (' + e.message + ')');
      accept(currentUrl);
    } finally { setIsUploading(false); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setIsUploading(true);
      const res = await api.post('/admin/upload_image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.status === 'success') accept(res.data.imageUrl);
      else toast.error(res.data?.error || 'Server rejected the image.');
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text" placeholder="https://..." value={localUrl}
          onChange={(e) => setLocalUrl(e.target.value)} onBlur={handleUrlBlur}
          className="glass-input" style={{ ...inputStyle, flex: 1 }}
        />
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        <button
          type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
          style={{
            padding: '0 20px', borderRadius: '12px', background: 'var(--accent-main)',
            color: 'white', border: 'none', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', opacity: isUploading ? 0.7 : 1, whiteSpace: 'nowrap',
          }}
        >{isUploading ? 'Uploading...' : 'Upload'}</button>
      </div>

      <div style={{
        height: '220px', borderRadius: '16px', border: '2px dashed var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-1)', overflow: 'hidden',
      }}>
        {url ? (
          <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <ImageIcon size={24} style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Wallpaper Preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WallpaperModal = ({ wallpaper, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', image_url: '', orientation: 'both',
    width: null, height: null, tags: '', prompt_key: '', category_id: '',
    is_featured: false, is_draft: false, sort_order: 0,
    meta_title: '', meta_description: '',
  });

  useEffect(() => {
    if (wallpaper) setFormData((prev) => ({ ...prev, ...wallpaper }));
  }, [wallpaper]);

  useEffect(() => {
    let cancelled = false;
    api.get('/admin/wallpaper_categories')
      .then((res) => { if (!cancelled) setCategories(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, []);

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!formData.title?.trim()) return toast.error('Title is required.');
    if (!formData.image_url?.trim()) return toast.error('An image is required.');

    setIsSaving(true);
    try {
      const res = await api.post('/admin/save_wallpaper', formData);
      if (res.data?.success) {
        toast.success(wallpaper ? 'Wallpaper updated' : 'Wallpaper added');
        onSave();
      } else {
        toast.error(res.data?.error || 'Save failed');
      }
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const { width, height } = formData;
  const tooSmall = width && height && (width < RECOMMENDED_MIN_WIDTH || height < RECOMMENDED_MIN_HEIGHT);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(6px)', overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto',
        background: 'var(--surface-0, #14141a)', borderRadius: '22px',
        border: '1px solid var(--border-color)', padding: '26px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
            {wallpaper ? 'Edit Wallpaper' : 'New Wallpaper'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Image</label>
            <WallpaperUpload
              url={formData.image_url}
              onUpload={(image_url) => set({ image_url })}
              onDimensions={(d) => set({ width: d?.width || null, height: d?.height || null })}
            />
            {width && height && (
              <p style={{
                margin: '9px 0 0', fontSize: '0.75rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '7px',
                color: tooSmall ? '#f5a524' : 'var(--text-muted)',
              }}>
                {tooSmall && <AlertTriangle size={14} />}
                {width} × {height}
                {tooSmall && ` — below ${RECOMMENDED_MIN_WIDTH}×${RECOMMENDED_MIN_HEIGHT}. The phone and desktop downloads will be upscaled and look soft.`}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text" value={formData.title} placeholder="Golden Hour Cinematic Portrait"
              onChange={(e) => set({ title: e.target.value })} style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={formData.description || ''} rows={3}
              placeholder="One or two lines describing the wallpaper — used on the page and in its meta description."
              onChange={(e) => set({ description: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Best suited for</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'phone', label: 'Phone', Icon: Smartphone },
                { id: 'desktop', label: 'Desktop', Icon: Monitor },
                { id: 'both', label: 'Both', Icon: ImageIcon },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id} type="button" onClick={() => set({ orientation: id })}
                  style={{
                    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    padding: '11px', borderRadius: '12px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 700,
                    background: formData.orientation === id ? 'var(--accent-main)' : 'var(--surface-1)',
                    color: formData.orientation === id ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${formData.orientation === id ? 'var(--accent-main)' : 'var(--border-color)'}`,
                  }}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => set({ category_id: e.target.value ? Number(e.target.value) : null })}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p style={{ margin: '7px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                No categories yet — add them under Wallpaper Categories, then reopen this.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Tags (comma separated)</label>
              <input
                type="text" value={formData.tags || ''} placeholder="nature, dark, minimal"
                onChange={(e) => set({ tags: e.target.value })} style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Linked prompt key (optional)</label>
              <input
                type="text" value={formData.prompt_key || ''} placeholder="PK1234"
                onChange={(e) => set({ prompt_key: e.target.value })} style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'white', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!formData.is_featured} onChange={(e) => set({ is_featured: e.target.checked })} />
              Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'white', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!formData.is_draft} onChange={(e) => set({ is_draft: e.target.checked })} />
              Draft (hidden from the site)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button" onClick={onClose}
              style={{ padding: '12px 20px', borderRadius: '12px', background: 'var(--surface-1)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >Cancel</button>
            <button
              type="button" onClick={handleSave} disabled={isSaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '12px', background: 'var(--accent-main)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}
            >
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save Wallpaper'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallpaperModal;
