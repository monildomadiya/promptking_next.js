"use client";
import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, Save } from '../Common/Icons';

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

const WallpaperCategoryModal = ({ category, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', sort_order: 0 });

  useEffect(() => {
    if (category) setFormData((prev) => ({ ...prev, ...category }));
  }, [category]);

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!formData.name?.trim()) return toast.error('Name is required.');
    setIsSaving(true);
    try {
      const res = await api.post('/admin/save_wallpaper_category', formData);
      if (res.data?.success) {
        toast.success(category ? 'Category updated' : 'Category added');
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

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(6px)', overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', background: 'var(--surface-0, #14141a)',
        borderRadius: '22px', border: '1px solid var(--border-color)', padding: '26px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
            {category ? 'Edit Category' : 'New Wallpaper Category'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text" value={formData.name} placeholder="Nature"
              onChange={(e) => set({ name: e.target.value })} style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description (optional)</label>
            <input
              type="text" value={formData.description || ''} placeholder="Landscapes, forests and skies."
              onChange={(e) => set({ description: e.target.value })} style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Sort order</label>
            <input
              type="number" value={formData.sort_order ?? 0}
              onChange={(e) => set({ sort_order: e.target.value })} style={inputStyle}
            />
            <p style={{ margin: '7px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Lower numbers sit further left in the pill row on /wallpapers.
            </p>
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
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallpaperCategoryModal;
