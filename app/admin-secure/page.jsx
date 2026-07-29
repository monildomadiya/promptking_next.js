"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend } from 'recharts';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Table, Edit, Trash, Plus, Settings, FileText, 
  TableProperties, LogOut, ChevronRight, ChevronLeft, Layout, 
  Share2, Palette, Activity, Users, Layers, Crown,
  Eye, Copy, ExternalLink, PieChart
} from '@/components/Common/Icons';
import PromptModal from '@/components/Admin/PromptModal';
import ListicleModal from '@/components/Admin/ListicleModal';
import BlogModal from '@/components/Admin/BlogModal';
import FAQModal from '@/components/Admin/FAQModal';
import CategoryModal from '@/components/Admin/CategoryModal';
import WebsiteCategoryModal from '@/components/Admin/WebsiteCategoryModal';
import AuthorModal from '@/components/Admin/AuthorModal';
import KingDialog from '@/components/Modals/KingDialog';
import toast, { Toaster } from 'react-hot-toast';
import CommandPalette from '@/components/Admin/CommandPalette';
import ContextMenu from '@/components/Admin/ContextMenu';
const KingLogo = '/promptking-logo.svg';

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' }
};

// --- MODERN STYLES ---
const glassPanelStyle = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--glass-border)',
  borderRadius: '24px',
};

const glassCardStyle = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
};

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  background: 'var(--surface-1)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-main)',
  fontSize: '0.95rem',
  transition: 'var(--transition-fast)',
  outline: 'none',
};

// --- COMPONENTS ---

const AdminOtpInput = ({ value, onChange, length = 10 }) => {
  const inputRefs = React.useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    const char = val.slice(-1);
    const newArr = value.split('');
    while (newArr.length <= index) newArr.push('');
    newArr[index] = char || '';
    
    onChange(newArr.join(''));
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newArr = value.split('');
      if (!newArr[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        newArr[index - 1] = '';
      } else {
        newArr[index] = '';
      }
      onChange(newArr.join(''));
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="password"
            inputMode="numeric"
            value={value[i] || ''}
            onChange={e => handleChange(e, i)}
            onKeyDown={e => handleKeyDown(e, i)}
            onPaste={handlePaste}
            style={{
              width: '42px',
              height: '50px',
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-1)',
              color: 'var(--text-main)',
              outline: 'none',
              transition: '0.2s',
              boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--accent-main)';
              e.target.style.background = '#ffffff';
              e.target.style.boxShadow = '0 0 10px rgba(229, 9, 20, 0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.background = 'var(--surface-1)';
              e.target.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)';
            }}
          />
        ))}
      </div>
      {length > 5 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {Array.from({ length: length - 5 }).map((_, i) => {
            const index = i + 5;
            return (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="password"
                inputMode="numeric"
                value={value[index] || ''}
                onChange={e => handleChange(e, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                onPaste={handlePaste}
                style={{
                  width: '42px',
                  height: '50px',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-1)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  transition: '0.2s',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--accent-main)';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 10px rgba(229, 9, 20, 0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.background = 'var(--surface-1)';
                  e.target.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)';
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const NavItem = ({ item, active, onClick, isMobileView, collapsed }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(item.id)}
    title={collapsed ? item.label : ''}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: '12px',
      padding: isMobileView ? '10px 18px' : collapsed ? '12px' : '12px 16px',
      borderRadius: '12px',
      cursor: 'pointer',
      marginBottom: isMobileView ? '0' : '4px',
      fontWeight: 700,
      fontSize: '0.85rem',
      transition: 'all 0.2s ease',
      color: active ? 'var(--accent-main)' : 'var(--text-dim)',
      background: active ? 'rgba(229, 9, 20, 0.08)' : 'var(--surface-1)',
      border: `1px solid ${active ? 'rgba(229, 9, 20, 0.3)' : 'var(--border-color)'}`,
      boxShadow: active && !isMobileView ? '0 2px 8px rgba(229, 9, 20, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
      position: 'relative',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      overflow: 'hidden',
    }}
  >
    <span style={{ color: active ? 'var(--accent-main)' : 'inherit', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {item.icon}
    </span>
    {!collapsed && <span>{item.label}</span>}
    {active && !isMobileView && (
      <motion.div
        layoutId="activeTabIndicator"
        style={{
          position: 'absolute',
          left: 0,
          width: '4px',
          height: '24px',
          background: 'var(--accent-main)',
          borderRadius: '0 4px 4px 0',
        }}
      />
    )}
    {active && isMobileView && (
      <motion.div
        layoutId="activeTabIndicatorMobile"
        style={{
          position: 'absolute',
          bottom: '0',
          left: '20%',
          right: '20%',
          height: '3px',
          background: 'var(--accent-main)',
          borderRadius: '4px 4px 0 0',
        }}
      />
    )}
  </motion.div>
);

const StatCard = ({ label, value, icon, color }) => (
  <motion.div
    variants={itemVariants}
    style={{
      ...glassCardStyle,
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}
  >
    <div style={{
      width: '52px',
      height: '52px',
      borderRadius: '14px',
      background: `${color}15`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</div>
    </div>
  </motion.div>
);

const ActionButton = ({ onClick, icon, color, label }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      padding: '8px 16px',
      background: color || 'var(--accent-main)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontWeight: 700,
      fontSize: '0.85rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    {icon}
    {label}
  </motion.button>
);

const SectionTitle = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-main)', textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>{title}</span>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(229,9,20,0.2), transparent)' }} />
  </div>
);

const Label = ({ text, icon }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
    {icon} {text}
  </label>
);

const Hint = ({ text }) => (
  <small style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', marginTop: '6px', display: 'block', fontWeight: 500 }}>{text}</small>
);

// --- DRAG HANDLE ICON ---
const DragHandleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.4, flexShrink: 0 }}>
    <circle cx="5" cy="4" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="5" cy="12" r="1.2"/>
    <circle cx="11" cy="4" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
  </svg>
);

// --- SORTABLE ROW for DnD ---
const StarIcon = ({ filled, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#FFD700' : 'none'} stroke={filled ? '#FFD700' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const SortableRow = ({ item, isSelected, onToggleSelect, onEdit, onDelete, onToggleFeatured, isMobile, isDragMode, onContextMenu }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.prompt_key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    background: isDragging
      ? 'rgba(229,9,20,0.08)'
      : isSelected
      ? 'rgba(229, 9, 20, 0.03)'
      : 'transparent',
    cursor: isDragMode ? 'grab' : 'default',
    userSelect: 'none',
  };

  return (
    <tr ref={setNodeRef} style={style} onContextMenu={(e) => onContextMenu && onContextMenu(e, item)}>
      <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDragMode ? (
            <span {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', color: 'var(--accent-main)' }} title="Drag to reorder">
              <DragHandleIcon />
            </span>
          ) : (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(item.prompt_key)}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-main)' }}
            />
          )}
        </div>
      </td>
      <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {item.img_after && (
            <img 
              src={item.img_after} 
              alt={item.title || 'Result'} 
              className="admin-thumb-hover"
              style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} 
              onError={e => e.target.style.display = 'none'} 
            />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{item.prompt_key}</div>
              {item.publish_date && new Date(item.publish_date) > new Date() && <span style={{ fontSize: '0.65rem', color: '#3b82f6', border: '1px solid #3b82f6', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', marginLeft: '4px' }}>SCHEDULED</span>}
              {item.is_featured && <span style={{ fontSize: '0.65rem', color: '#fff', background: 'rgba(229, 9, 20, 0.8)', border: '1px solid rgba(229, 9, 20, 1)', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', fontWeight: 'bold' }}>FEATURED</span>}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || item.slug}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>{item.is_premium ? 'PRO' : 'FREE'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }} title="Times Opened (Views)">
            <Eye size={12} /> {item.view_count || 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,163,127,0.1)', color: '#10a37f', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }} title="Times Copied">
            <Copy size={12} /> {item.copy_count || 0}
          </div>
        </div>
      </td>
      <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
        {item.is_premium ? (
          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#fbbf24', letterSpacing: '2px', background: 'rgba(251,191,36,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
            {item.password || '----'}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>-</span>
        )}
      </td>
      <td style={{ padding: isMobile ? '16px' : '20px 24px', textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div
            onClick={() => onToggleFeatured(item)}
            title={item.is_featured ? 'Unfeature this prompt' : 'Feature this prompt'}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: item.is_featured ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.03)',
              border: item.is_featured ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: item.is_featured ? '0 0 10px rgba(255,215,0,0.2)' : 'none'
            }}
          >
            <StarIcon filled={item.is_featured} size={14} />
          </div>
          <div onClick={() => onEdit(item)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit size={14} color="var(--text-dim)" /></div>
          <div onClick={() => onDelete(item)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(229, 9, 20, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash size={14} color="var(--accent-main)" /></div>
        </div>
      </td>
    </tr>
  );
};

const BrandingPanel = ({ onSave, isMobile }) => {
  const [settings, setSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(res => setSettings(res.data));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/admin/save_settings', settings);
      onSave();
      localStorage.removeItem('siteSettings_ts');
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      toast.success("Branding settings applied!");
    } catch(e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      {/* Header */}
      <div style={{ ...glassPanelStyle, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(229,9,20,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={22} color="var(--accent-main)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2px' }}>Branding & Identity</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Customize your site's visual presence.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="glass-button-secondary"
          style={{ 
            padding: '12px 24px', borderRadius: '12px', background: 'var(--accent-main)', 
            color: 'white', border: 'none', fontWeight: 700, opacity: isSaving ? 0.5 : 1
          }}
        >
          {isSaving ? "Saving..." : "Apply Changes"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: !isMobile ? '350px 1fr' : '1fr', gap: '25px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {/* Logo Preview Card */}
          <div style={{ ...glassPanelStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionTitle title="Logo Preview" />
            <div style={{ 
              aspectRatio: '1', borderRadius: '20px', background: 'rgba(0,0,0,0.4)', 
              border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden'
            }}>
              {settings.logo_url ? (
                 <img src={settings.logo_url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Logo" />
              ) : (
                 <Palette size={48} style={{ opacity: 0.1 }} />
              )}
            </div>
            <div style={{ position: 'relative' }}>
               <input 
                 type="file" 
                 id="logo-upload"
                 accept="image/*"
                 style={{ display: 'none' }}
                 onChange={async (e) => {
                   if (e.target.files && e.target.files[0]) {
                     const formData = new FormData();
                     formData.append('logo', e.target.files[0]);
                     try {
                       const res = await api.post('/admin/upload_logo', formData);
                       if (res.data.status === 'success') {
                         setSettings({ ...settings, logo_url: res.data.logoUrl });
                         toast.success("Logo uploaded successfully!");
                       }
                     } catch (err) {
                       console.error(err);
                       toast.error("Failed to upload logo.");
                     }
                   }
                 }}
               />
               <button 
                 onClick={() => document.getElementById('logo-upload').click()}
                 className="glass-button-secondary"
                 style={{ 
                   width: '100%', 
                   padding: '14px', 
                   borderRadius: '12px', 
                   fontWeight: 800, 
                   fontSize: '0.9rem', 
                   color: 'var(--accent-main)',
                   background: 'rgba(229, 9, 20, 0.05)',
                   border: '1px solid rgba(229, 9, 20, 0.2)',
                   cursor: 'pointer'
                 }}
               >
                 Choose Logo File
               </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>SVG, PNG or WEBP recommended.</p>
          </div>

          {/* Favicon Card - Now Static */}
          <div style={{ ...glassPanelStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionTitle title="Favicon" />
            <div style={{ 
              aspectRatio: '1', borderRadius: '20px', background: 'rgba(0,0,0,0.4)', 
              border: '1px solid rgba(229, 9, 20,0.2)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden'
            }}>
              <img src="/favicon.png" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }} alt="Favicon" />
            </div>
            <div style={{ 
              padding: '14px 18px', 
              background: 'rgba(229, 9, 20, 0.05)', 
              border: '1px solid rgba(229, 9, 20, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10a37f', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Favicon is permanently set to the PromptKing logo. Loads instantly from static files — no server requests needed.
              </span>
            </div>
          </div>
        </div>

        {/* Dimension Settings Card */}
        <div style={{ ...glassPanelStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <SectionTitle title="Dimension Tuning" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <Label text="Desktop Height" icon={<Layout size={14} />} />
              <input 
                style={inputStyle} 
                value={settings.logo_height_desktop || ''} 
                onChange={e => setSettings({...settings, logo_height_desktop: e.target.value})} 
                placeholder="e.g. 50px" 
              />
              <Hint text="Affects header logo on PCs" />
            </div>
            <div>
              <Label text="Desktop Width" icon={<Layout size={14} />} />
              <input 
                style={inputStyle} 
                value={settings.logo_width_desktop || ''} 
                onChange={e => setSettings({...settings, logo_width_desktop: e.target.value})} 
                placeholder="e.g. auto" 
              />
              <Hint text="Affects header logo width on PCs" />
            </div>
            <div>
              <Label text="Mobile Height" icon={<Activity size={14} />} />
              <input 
                style={inputStyle} 
                value={settings.logo_height_mobile || ''} 
                onChange={e => setSettings({...settings, logo_height_mobile: e.target.value})} 
                placeholder="e.g. 32px" 
              />
              <Hint text="Affects header logo on phones" />
            </div>
            <div>
              <Label text="Mobile Width" icon={<Activity size={14} />} />
              <input 
                style={inputStyle} 
                value={settings.logo_width_mobile || ''} 
                onChange={e => setSettings({...settings, logo_width_mobile: e.target.value})} 
                placeholder="e.g. auto" 
              />
              <Hint text="Affects header logo width on phones" />
            </div>
          </div>

          <div className="glass-divider" />

          <div>
             <SectionTitle title="Health Check" />
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10a37f', boxShadow: '0 0 10px #10a37f' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Branding Assets Synchronized</span>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SocialPanel = ({ onSave }) => {
  const [settings, setSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(res => setSettings(res.data));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/admin/save_settings', settings);
      onSave();
      localStorage.removeItem('siteSettings_ts');
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      toast.success("Social links updated!");
    } catch(e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const socialGroups = [
    { key: 'youtube', label: 'YouTube Channel', icon: <Activity size={20} color="#ff0000" />, bg: 'rgba(255,0,0,0.08)', desc: 'Promote your video content' },
    { key: 'instagram', label: 'Instagram Profile', icon: <Activity size={20} color="#e1306c" />, bg: 'rgba(225,48,108,0.08)', desc: 'Share your visual feed' },
    { key: 'facebook', label: 'Facebook Page', icon: <Activity size={20} color="#1877f2" />, bg: 'rgba(24,119,242,0.08)', desc: 'Connect with community' },
    { key: 'pinterest', label: 'Pinterest Page', icon: <Activity size={20} color="#E60023" />, bg: 'rgba(230,0,35,0.08)', desc: 'Inspire with AI collections' },
  ];

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      {/* Header */}
      <div style={{ ...glassPanelStyle, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={22} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2px' }}>Social Synergy</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Manage your official channel integrations.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="glass-button-secondary"
          style={{ 
            padding: '12px 24px', borderRadius: '12px', background: '#3b82f6', 
            color: 'white', border: 'none', fontWeight: 700, opacity: isSaving ? 0.5 : 1
          }}
        >
          {isSaving ? "Saving..." : "Update Channels"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        {socialGroups.map(group => (
          <div key={group.key} style={{ ...glassPanelStyle, padding: '25px', position: 'relative', overflow: 'hidden' }}>
            {/* Background Glow */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '100px', height: '100px', background: group.bg, filter: 'blur(40px)', zIndex: 0 }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {group.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{group.label}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{group.desc}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <Label text="Display Title" />
                  <input 
                    style={inputStyle} 
                    placeholder="e.g. Subscribe on YouTube" 
                    value={settings[`${group.key}_title`] || ''} 
                    onChange={e => setSettings({...settings, [`${group.key}_title`]: e.target.value})} 
                  />
                </div>
                <div>
                  <Label text={group.label + " URL"} />
                  <input 
                    style={inputStyle} 
                    placeholder="https://..." 
                    value={settings[`${group.key}_url`] || ''} 
                    onChange={e => setSettings({...settings, [`${group.key}_url`]: e.target.value})} 
                  />
                  <Hint text="Must be a valid absolute URL" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};



const SliderPreview = ({ position, samplePrompt }) => {
  const previewRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [localValue, setLocalValue] = useState(Number(position));

  // Sync with parent position when slider changes
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(Number(position));
    }
  }, [position]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current || !previewRef.current) return;
    e.preventDefault();
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setLocalValue(percent);
  }, []);

  const handlePointerUp = useCallback((e) => {
    isDraggingRef.current = false;
    if (e.currentTarget) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(ex) {}
    }
  }, []);

  const beforeImg = samplePrompt?.img_before || samplePrompt?.imgBefore;
  const afterImg = samplePrompt?.img_after || samplePrompt?.imgAfter || samplePrompt?.thumbnail_url;

  if (!beforeImg || !afterImg) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))',
        border: '1px solid rgba(168,85,247,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '8px'
      }}>
        <Eye size={24} color="rgba(168,85,247,0.4)" />
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
          No before/after prompts found for preview
        </span>
      </div>
    );
  }

  return (
    <div>
      <div 
        ref={previewRef} 
        style={{ 
          width: '100%', aspectRatio: '16/9', borderRadius: '16px',
          position: 'relative', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
          background: '#111',
          cursor: 'default'
        }}
      >
        {/* After image (bottom layer) */}
        <img 
          src={afterImg} 
          alt="After" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        {/* Before image (clipped top layer) */}
        <img 
          src={beforeImg} 
          alt="Before" 
          style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
            clipPath: `inset(0 ${100 - localValue}% 0 0)`,
            WebkitClipPath: `inset(0 ${100 - localValue}% 0 0)`,
            zIndex: 2
          }} 
        />

        {/* Before / After labels */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 15,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          borderRadius: '8px', padding: '4px 10px',
          fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: localValue > 8 ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}>Before</div>
        <div style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 15,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          borderRadius: '8px', padding: '4px 10px',
          fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: localValue < 92 ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}>After</div>

        {/* Draggable handle zone */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ 
            position: 'absolute', top: 0, bottom: 0, left: `${localValue}%`, width: '44px', 
            zIndex: 10, transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'ew-resize',
            touchAction: 'none'
          }}
        >
          {/* Glowing divider line */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px',
            background: 'rgba(255, 255, 255, 0.8)', transform: 'translateX(-50%)', pointerEvents: 'none',
            boxShadow: '0 0 8px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.2)'
          }} />
          {/* Glass capsule handle */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.25), rgba(168, 85, 247, 0.08))',
              borderRadius: '14px', width: '28px', height: '52px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 12px rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              flexShrink: 0, pointerEvents: 'none', position: 'relative', zIndex: 2
            }}
          >
            <ChevronLeft size={14} color="rgba(255, 255, 255, 0.85)" strokeWidth={2.5} style={{ display: 'block' }} />
            <div style={{ width: '12px', height: '1px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '1px' }} />
            <ChevronRight size={14} color="rgba(255, 255, 255, 0.85)" strokeWidth={2.5} style={{ display: 'block' }} />
          </div>
        </div>
      </div>
      {samplePrompt?.title && (
        <div style={{ marginTop: '8px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 500, textAlign: 'center' }}>
          Preview using: {samplePrompt.title}
        </div>
      )}
    </div>
  );
};

const UIPanel = ({ onSave, isMobile }) => {
  const [settings, setSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [samplePrompt, setSamplePrompt] = useState(null);

  useEffect(() => {
    api.get('/admin/settings').then(res => setSettings(res.data));
    // Fetch a sample prompt with before/after images for the preview
    api.get('/admin/prompts').then(res => {
      if (Array.isArray(res.data)) {
        const sliderPrompt = res.data.find(p => 
          (p.is_image_slider === 1 || p.is_image_slider === true) && 
          p.img_before && p.img_after
        ) || res.data.find(p => p.img_before && p.img_after);
        if (sliderPrompt) setSamplePrompt(sliderPrompt);
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/admin/save_settings', settings);
      onSave();
      localStorage.removeItem('siteSettings_ts');
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      toast.success("UI settings applied!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const sliderPos = settings.slider_default_position || 50;

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      {/* Header */}
      <div style={{ ...glassPanelStyle, padding: isMobile ? '20px' : '24px 32px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layout size={22} color="#a855f7" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2px' }}>UI Settings</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>Configure global UI components and slider behavior.</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="glass-button-secondary"
          style={{ 
            padding: '12px 24px', borderRadius: '12px', background: '#a855f7', 
            color: 'white', border: 'none', fontWeight: 700, opacity: isSaving ? 0.5 : 1,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
            width: isMobile ? '100%' : 'auto'
          }}
        >
          {isSaving ? "Saving..." : "Apply UI Settings"}
        </button>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        {/* Slider Controls Card */}
        <div style={{ ...glassPanelStyle, padding: isMobile ? '20px' : '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SectionTitle title="Global UI Components" />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <Label text="Image Slider Default Position" />
              <span style={{ 
                fontSize: '0.85rem', color: '#a855f7', fontWeight: 800,
                background: 'rgba(168,85,247,0.1)', padding: '4px 12px', borderRadius: '8px',
                border: '1px solid rgba(168,85,247,0.2)', fontVariantNumeric: 'tabular-nums'
              }}>
                {sliderPos}%
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={sliderPos} 
              onChange={e => setSettings({...settings, slider_default_position: e.target.value})} 
              style={{ width: '100%', accentColor: '#a855f7', marginTop: '10px' }}
            />
            <Hint text="Sets where the before/after image slider starts globally (default is 50%)." />
          </div>
        </div>

        {/* Live Preview Card */}
        <div style={{ ...glassPanelStyle, padding: isMobile ? '20px' : '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SectionTitle title="Slider Preview" />
          <SliderPreview position={sliderPos} samplePrompt={samplePrompt} />
        </div>
      </div>
    </motion.div>
  );
};

const AdsPanel = ({ onSave }) => {
  const [settings, setSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(res => setSettings(res.data));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/admin/save_settings', settings);
      onSave();
      localStorage.removeItem('siteSettings_ts');
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      toast.success("Ads configuration updated! Changes may take a moment to propagate.");
    } catch(e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <div style={{ ...glassPanelStyle, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="#fbbf24" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2px' }}>Revenue & Ads</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Manage Google AdSense placements and policy compliance.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="glass-button-secondary"
          style={{ 
            padding: '12px 24px', borderRadius: '12px', background: '#fbbf24', 
            color: 'black', border: 'none', fontWeight: 800, opacity: isSaving ? 0.5 : 1
          }}
        >
          {isSaving ? "Saving..." : "Apply Ad Settings"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
        {/* Global Config */}
        <div style={{ ...glassPanelStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SectionTitle title="Global Configuration" />
          <div>
            <Label text="AdSense Client ID" />
            <input 
              style={inputStyle} 
              placeholder="ca-pub-XXXXXXXXXXXXXXXX" 
              value={settings.adsense_client_id || ''} 
              onChange={e => setSettings({...settings, adsense_client_id: e.target.value})} 
            />
            <Hint text="Your unique Google AdSense publisher ID." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Enable All Ads</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Global toggle for ad visibility</div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.adsense_enabled === '1'} 
              onChange={e => setSettings({...settings, adsense_enabled: e.target.checked ? '1' : '0'})}
              style={{ width: '20px', height: '20px', accentColor: '#fbbf24' }}
            />
          </div>
        </div>

        {/* Slot IDs */}
        <div style={{ ...glassPanelStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SectionTitle title="Ad Placement Slots" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <Label text="Header Slot" />
              <input 
                style={inputStyle} 
                placeholder="Slot ID" 
                value={settings.adsense_slot_header || ''} 
                onChange={e => setSettings({...settings, adsense_slot_header: e.target.value})} 
              />
            </div>
            <div>
              <Label text="Sidebar Slot" />
              <input 
                style={inputStyle} 
                placeholder="Slot ID" 
                value={settings.adsense_slot_sidebar || ''} 
                onChange={e => setSettings({...settings, adsense_slot_sidebar: e.target.value})} 
              />
            </div>
            <div>
              <Label text="Detail Slot" />
              <input 
                style={inputStyle} 
                placeholder="Slot ID" 
                value={settings.adsense_slot_detail || ''} 
                onChange={e => setSettings({...settings, adsense_slot_detail: e.target.value})} 
              />
            </div>
            <div>
              <Label text="Footer Slot" />
              <input 
                style={inputStyle} 
                placeholder="Slot ID" 
                value={settings.adsense_slot_footer || ''} 
                onChange={e => setSettings({...settings, adsense_slot_footer: e.target.value})} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label text="In-Feed Native Ad Slot (Prompt Grid)" />
              <input
                style={inputStyle}
                placeholder="Slot ID"
                value={settings.adsense_slot_infeed || ''}
                onChange={e => setSettings({...settings, adsense_slot_infeed: e.target.value})}
              />
            </div>
            <div>
              <Label text="Anchor / Sticky Ad Slot (Mobile RPM booster)" />
              <input
                style={inputStyle}
                placeholder="Slot ID"
                value={settings.adsense_slot_anchor || ''}
                onChange={e => setSettings({...settings, adsense_slot_anchor: e.target.value})}
              />
            </div>
            <div>
              <Label text="Multiplex Slot (Recommended grid, format: autorelaxed)" />
              <input
                style={inputStyle}
                placeholder="Slot ID"
                value={settings.adsense_slot_multiplex || ''}
                onChange={e => setSettings({...settings, adsense_slot_multiplex: e.target.value})}
              />
            </div>
          </div>
          <Hint text="Leave blank to disable specific placements. Anchor = create a 'Display' unit; Multiplex = create a 'Multiplex' unit in AdSense." />
        </div>
      </div>
    </motion.div>
  );
};


const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [view, setView] = useState('dashboard');
  const [data, setData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [promptAnalytics, setPromptAnalytics] = useState([]);
  const [blogAnalytics, setBlogAnalytics] = useState([]);
  const [stats, setStats] = useState({ prompts: 0, copies: 0, unlocks: 0, views: 0, likes: 0, blogs: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKingDialogOpen, setIsKingDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [settings, setSettings] = useState({});
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [analyticsDays, setAnalyticsDays] = useState('30');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, item: null });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAccess, setFilterAccess] = useState('all');
  const [isDataLoading, setIsDataLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 1100);
    const handleResize = () => setIsMobile(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkAuth(); 
    api.get('/admin/settings').then(res => setSettings(res.data));
  }, []);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't fire shortcuts when typing in inputs/textareas
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!isAdmin) return;

      switch (e.key) {
        case 'Escape':
          setIsModalOpen(false);
          setIsKingDialogOpen(false);
          break;
        case 'n':
        case 'N':
          if (['prompts', 'listicles', 'blogs', 'categories', 'website_categories', 'authors', 'faqs'].includes(view)) {
            setEditingItem(null);
            setIsModalOpen(true);
          }
          break;
        case '1': setView('dashboard'); break;
        case '2': setView('prompts'); fetchData('prompts'); break;
        case '3': setView('blogs'); fetchData('blogs'); break;
        case '4': setView('categories'); fetchData('categories'); break;
        case '5': setView('faqs'); fetchData('faqs'); break;
        case '[': setSidebarCollapsed(c => !c); break;
        case 'k':
        case 'K':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsCommandPaletteOpen(o => !o);
          }
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, view]);

  useEffect(() => {
    setSelectedKeys([]);
    setAdminSearch('');
  }, [view]);

  useEffect(() => {
    if (password.length === 10 && !isAdmin) {
      handleLogin();
    }
  }, [password, isAdmin]);

  const checkAuth = async () => {
    try {
      const response = await api.get('/admin/check_auth');
      setIsAdmin(response.data.isAdmin);
      if (response.data.isAdmin) {
        fetchData('prompts');
        fetchAnalytics();
        fetchDashboardStats();
      }
    } catch (e) { console.error(e); }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data && !res.data.error) {
        setStats(res.data);
      }
    } catch (e) { console.error('Dashboard stats error:', e); }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    try {
      const response = await api.post('/admin/login', { password });
      if (response.data && response.data.error) {
        toast.error(response.data.error);
        return;
      }
      if (response.data && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        setIsAdmin(true);
        fetchData('prompts');
        fetchAnalytics();
        fetchDashboardStats();
      } else {
        toast.error("Authentication failed.");
      }
    } catch (e) { 
      toast.error("Network or authentication error."); 
    }
  };

  
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, item });
  };

  const getContextMenuActions = () => {
    if (!contextMenu.item) return [];
    return [
      { label: 'Edit', icon: <Edit size={14} />, onClick: () => setEditingItem(contextMenu.item) },
      { label: 'Toggle Featured', icon: <Crown size={14} />, onClick: () => handleToggleFeatured(contextMenu.item) },
      { type: 'divider' },
      { label: 'Delete', icon: <Trash size={14} />, danger: true, onClick: () => handleDelete(contextMenu.item) }
    ];
  };

  const handleCommandAction = (action, item) => {
    setIsCommandPaletteOpen(false);
    switch (action) {
      case 'NEW_PROMPT': setView('prompts'); setEditingItem(null); setIsModalOpen(true); break;
      case 'NEW_BLOG': setView('blogs'); setEditingItem(null); setIsModalOpen(true); break;
      case 'NAV_SETTINGS': setView('settings'); break;
      case 'NAV_BRANDING': setView('branding'); break;
      case 'RESET_ANALYTICS': handleResetAnalytics(); break;
      case 'LOGOUT': handleLogout(); break;
      case 'EDIT_ITEM': 
        if (item.website_category_id) setView('listicles');
        else if (item.prompt_key) setView('prompts');
        else if (item.slug && item.content) setView('blogs');
        else if (item.answer) setView('faqs');
        setEditingItem(item); 
        setIsModalOpen(true); 
        break;
      default: break;
    }
  };

  const handleLogout = async () => {
    await api.get('/admin/logout');
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setPassword('');
  };

  const fetchData = async (currentView) => {
    if (currentView === 'settings') return;
    setIsDataLoading(true);
    try {
      const endpoint = currentView === 'settings' ? 'settings' : currentView;
      const response = await api.get(`/admin/${endpoint}`);
      setData(response.data);
      if (currentView === 'prompts' || currentView === 'listicles') {
        fetchDashboardStats();
      }
    } catch (e) { console.error(e); }
    finally { setIsDataLoading(false); }
  };

  // Switch tab: clear stale data immediately so old tab content never flashes
  const switchView = (id) => {
    const dataView = id.startsWith('settings') ? 'settings' : id;
    setView(id);
    if (dataView !== 'settings') {
      setData([]);          // clear immediately — no stale flash
      setAdminSearch('');
      setSelectedKeys([]);
    }
    fetchData(dataView);
  };

  const fetchAnalytics = async (days = analyticsDays) => {
    try {
      const response = await api.get(`/admin/analytics?days=${days}`);
      if (Array.isArray(response.data)) {
        setAnalyticsData(response.data);
      } else {
        console.warn("Analytics response was not an array:", response.data);
        setAnalyticsData([]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchPromptAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics/prompts');
      if (Array.isArray(response.data)) {
        setPromptAnalytics(response.data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchBlogAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics/blogs');
      if (Array.isArray(response.data)) {
        setBlogAnalytics(response.data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics(analyticsDays);
      fetchPromptAnalytics();
      fetchBlogAnalytics();
    }
  }, [analyticsDays, isAdmin]);

  const handleResetAnalytics = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently reset all interaction counts (views, copies, unlocks) to zero. Are you absolutely sure?")) return;
    try {
      await api.post('/admin/analytics/reset');
      fetchData('prompts');
      fetchAnalytics(analyticsDays);
      fetchDashboardStats();
      toast.success("Analytics data has been completely reset.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to reset analytics data.");
    }
  };

  const handleDelete = async (item) => {
    const enteredPassword = window.prompt("Enter admin password to confirm deletion:");
    if (!enteredPassword) return;

    try {
      const loginRes = await api.post('/admin/login', { password: enteredPassword });
      if (!loginRes.data || !loginRes.data.token) {
        toast.error("Incorrect password. Deletion cancelled.");
        return;
      }
    } catch (err) {
      toast.error("Authentication error.");
      return;
    }

    if (!window.confirm("Permanent delete? This cannot be undone.")) return;
    const id = item.prompt_key || item.id;
    const type = view === 'prompts' ? 'prompt' : (view === 'listicles' ? 'listicle' : (view === 'blogs' ? 'blog' : (view === 'categories' ? 'category' : (view === 'website_categories' ? 'website_category' : (view === 'authors' ? 'author' : 'faq')))));
    try {
      await api.delete(`/admin/delete_${type}/${id}`);
      fetchData(view);
    } catch (err) {
      toast.error("Deletion failed. See console for details.");
      console.error(err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setData((items) => {
      const oldIndex = items.findIndex(i => i.prompt_key === active.id);
      const newIndex = items.findIndex(i => i.prompt_key === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const orderedKeys = data.map(i => i.prompt_key);
      await api.post('/admin/reorder_prompts', { orderedKeys });
      setIsDragMode(false);
      toast.success('Order saved successfully!');
    } catch (e) {
      toast.error('Failed to save order.');
      console.error(e);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleBulkDelete = async () => {
    if (view !== 'prompts') return;
    
    const enteredPassword = window.prompt("Enter admin password to confirm bulk deletion:");
    if (!enteredPassword) return;

    try {
      const loginRes = await api.post('/admin/login', { password: enteredPassword });
      if (!loginRes.data || !loginRes.data.token) {
        toast.error("Incorrect password. Deletion cancelled.");
        return;
      }
    } catch (err) {
      toast.error("Authentication error.");
      return;
    }

    if (!window.confirm(`Delete ${selectedKeys.length} prompts permanently?`)) return;
    
    try {
      await api.post('/admin/delete_prompts_bulk', { keys: selectedKeys });
      setSelectedKeys([]);
      fetchData(view);
      toast.success("Bulk deletion successful.");
    } catch (err) {
      toast.error("Bulk deletion failed.");
      console.error(err);
    }
  };

  const handleBulkVisibility = async (hide) => {
    if (view !== 'prompts') return;
    if (!window.confirm(`Bulk ${hide ? 'hide' : 'show'} ${selectedKeys.length} prompts?`)) return;
    
    try {
      await api.post('/admin/hide_prompts_bulk', { keys: selectedKeys, hide });
      setSelectedKeys([]);
      fetchData(view);
      toast.success(`Bulk ${hide ? 'hide' : 'show'} successful.`);
    } catch (err) {
      toast.error(`Bulk ${hide ? 'hide' : 'show'} failed.`);
      console.error(err);
    }
  };

  const handleToggleFeatured = async (item) => {
    const newFeatured = !item.is_featured;
    // Optimistic UI update
    setData(prev => prev.map(p => p.prompt_key === item.prompt_key ? { ...p, is_featured: newFeatured } : p));
    try {
      await api.post('/admin/toggle_featured', { key: item.prompt_key, is_featured: newFeatured });
    } catch (err) {
      // Revert on failure
      setData(prev => prev.map(p => p.prompt_key === item.prompt_key ? { ...p, is_featured: item.is_featured } : p));
      toast.error('Failed to update featured status.');
    }
  };

  const handleToggleStatus = async (item, field) => {
    const newValue = !item[field];
    let extraData = {};

    if (field === 'is_premium' && newValue === true) {
      const pin = window.prompt(`Enter a PIN (max 4 numeric digits) to make prompt "${item.title || item.prompt_key}" PRO:`);
      if (!pin) {
        toast.error("A PIN is required to set a prompt to PRO.");
        return;
      }
      if (!/^\d{4}$/.test(pin)) {
        toast.error("PIN must be EXACTLY 4 numeric digits.");
        return;
      }
      extraData.pin = pin;
    }

    // Optimistic UI update
    setData(prev => prev.map(p => p.prompt_key === item.prompt_key ? { ...p, [field]: newValue, ...(extraData.pin && { password: extraData.pin }) } : p));
    try {
      await api.post('/admin/toggle_status', { key: item.prompt_key, field, value: newValue, ...extraData });
      toast.success(`Updated successfully.`);
    } catch (err) {
      // Revert on failure
      setData(prev => prev.map(p => p.prompt_key === item.prompt_key ? { ...p, [field]: item[field] } : p));
      toast.error('Failed to update status.');
    }
  };

  const toggleSelect = (key) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = (visibleItems) => {
    const itemsToSelect = visibleItems || data;
    if (selectedKeys.length === itemsToSelect.length) {
      setSelectedKeys([]);
    } else {
      const allKeys = itemsToSelect.map(item => item.prompt_key || item.id);
      setSelectedKeys(allKeys);
    }
  };

  const filteredData = Array.isArray(data) ? data.filter(item => {
    let match = true;
    if (view === 'prompts') {
      if (filterStatus === 'published') match = !(item.publish_date && new Date(item.publish_date) > new Date());

      if (match && filterAccess !== 'all') {
        if (filterAccess === 'pro') match = !!item.is_premium;
        else if (filterAccess === 'free') match = !item.is_premium;
      }
    }
    if (!match) return false;

    if (!adminSearch) return true;
    const search = adminSearch.toLowerCase();
    const promptKey = String(item.prompt_key || '').toLowerCase();
    const title = String(item.title || item.name || '').toLowerCase();
    const aiType = String(item.ai_type || item.aiType || '').toLowerCase();
    return promptKey.includes(search) || title.includes(search) || aiType.includes(search);
  }).sort((a, b) => {
    if (view === 'prompts') {
      if (sortBy === 'views_desc') return (Number(b.view_count) || 0) - (Number(a.view_count) || 0);
      if (sortBy === 'copies_desc') return (Number(b.copy_count) || 0) - (Number(a.copy_count) || 0);
    }
    return 0;
  }) : [];

  if (!isAdmin) {
    return (
      <div className="admin-light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--surface-0)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ ...glassPanelStyle, padding: '48px', width: '400px', textAlign: 'center', background: '#ffffff', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', width: '100%' }}>
            <img src={KingLogo} style={{ width: '120px', height: '120px', objectFit: 'contain' }} alt="Prompt King" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '32px', fontSize: '0.9rem', fontWeight: 500 }}>Authenticated Access Only</p>
          <form onSubmit={handleLogin}>
            <AdminOtpInput value={password} onChange={setPassword} length={10} />
          </form>
        </motion.div>
      </div>
    );
  }

  const menuGroups = [
    { title: 'CORE CONTENT', items: [
      { id: 'dashboard', label: 'Overview', icon: <Layout size={20} /> },
      { id: 'prompts', label: 'Prompts', icon: <TableProperties size={20} /> },
      { id: 'listicles', label: 'Listicles', icon: <FileText size={20} /> },
      { id: 'blogs', label: 'Articles', icon: <FileText size={20} /> },
      { id: 'authors', label: 'Authors', icon: <Users size={20} /> },
      { id: 'categories', label: 'AI Types', icon: <Layers size={20} /> },
      { id: 'website_categories', label: 'Website Categories', icon: <Layers size={20} /> },
      { id: 'faqs', label: 'Help Desk', icon: <Activity size={20} /> },
    ]},
    { title: 'SYSTEM CONFIG', items: [
      { id: 'settings-branding', label: 'Branding', icon: <Palette size={20} /> },
      { id: 'settings-ui', label: 'UI Settings', icon: <Layout size={20} /> },
      { id: 'settings-social', label: 'Channels', icon: <Share2 size={20} /> },
      { id: 'settings-ads', label: 'Ads Management', icon: <Activity size={20} /> },
    ]}
  ];

  // When PromptModal/ListicleModal is open, render ONLY the modal as a full page
  // (no dashboard content behind it) so screenshot tools don't repeat it.
  if (isModalOpen && view === 'prompts') {
    return (
      <div className="admin-light">
        <Toaster position="top-right" toastOptions={{ style: { background: '#ffffff', color: '#14161a', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' } }} />
        <PromptModal
          prompt={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSave={() => { setIsModalOpen(false); fetchData(view); }}
        />
      </div>
    );
  }
  
  if (isModalOpen && view === 'listicles') {
    return (
      <div className="admin-light">
        <Toaster position="top-right" toastOptions={{ style: { background: '#ffffff', color: '#14161a', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' } }} />
        <ListicleModal
          prompt={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSave={() => { setIsModalOpen(false); fetchData(view); }}
        />
      </div>
    );
  }

  return (
    <div className="admin-light" style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh', 
      overflowX: 'hidden'
    }}>
      {/* Sidebar (Desktop Only) */}
      {!isMobile && (
        <motion.aside
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1, width: sidebarCollapsed ? '72px' : '280px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: 'var(--surface-1)',
            borderRight: '1px solid var(--glass-border)',
            padding: sidebarCollapsed ? '32px 12px' : '32px 24px',
            position: 'fixed',
            height: '100vh',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'padding 0.3s ease'
          }}
        >
          {/* Collapse Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarCollapsed(c => !c)}
            title="Toggle sidebar [ ]"
            style={{
              position: 'absolute',
              top: '20px',
              right: '-14px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--surface-1)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 101,
              fontSize: '12px',
              fontWeight: 900,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </motion.button>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', width: '100%' }}>
            {sidebarCollapsed ? (
              <img src={KingLogo} style={{ width: '40px', height: '40px', objectFit: 'contain', display: 'block' }} alt="PK" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 10px' }}>
                <img src={KingLogo} style={{ height: '60px', width: '100%', maxWidth: '200px', objectFit: 'contain', display: 'block' }} alt="Prompt King" />
              </div>
            )}
          </div>

          <motion.nav variants={containerVariants} initial="hidden" animate="visible" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }} className="hide-scrollbar">
            {menuGroups.map((group, idx) => (
              <div key={idx} style={{ marginBottom: '32px' }}>
                {!sidebarCollapsed && (
                  <div style={{ paddingLeft: '16px', marginBottom: '16px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px' }}>{group.title}</div>
                )}
                {sidebarCollapsed && idx > 0 && (
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0 16px' }} />
                )}
                {group.items.map(item => (
                  <NavItem key={item.id} item={item} active={view === item.id} collapsed={sidebarCollapsed} onClick={switchView} isMobileView={false} />
                ))}
              </div>
            ))}
          </motion.nav>

          <div onClick={handleLogout} title={sidebarCollapsed ? 'Sign Out' : ''} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: '12px', padding: sidebarCollapsed ? '14px' : '14px 16px', borderRadius: '12px', color: 'var(--text-dim)', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Sign Out</span>}
          </div>

          {/* Keyboard Shortcuts Hint */}
          {!sidebarCollapsed && (
            <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>SHORTCUTS</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', lineHeight: '1.8' }}>
                <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '4px', marginRight: '6px' }}>N</span>New item<br/>
                <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '4px', marginRight: '6px' }}>1-5</span>Switch view<br/>
                <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '4px', marginRight: '6px' }}>[</span>Toggle sidebar<br/>
                <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '4px', marginRight: '6px' }}>Esc</span>Close modal
              </div>
            </div>
          )}
        </motion.aside>
      )}

      {/* Mobile Top Navigation */}
      {isMobile && (
        <div style={{ 
          position: 'sticky', top: 0, zIndex: 1000, 
          background: 'rgba(10,10,12,0.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          width: '100%'
        }}>
          <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="animated-logo" style={{ width: '32px', height: '32px', background: 'var(--accent-gradient)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>PK</div>
              <span style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '-0.5px' }}>KING ADMIN</span>
            </div>
            <div onClick={handleLogout} style={{ padding: '8px', color: 'var(--accent-main)' }}><LogOut size={20} /></div>
          </div>
          <div style={{ 
            display: 'flex', overflowX: 'auto', padding: '0 20px 15px', gap: '10px',
            msOverflowStyle: 'none', scrollbarWidth: 'none'
          }}>
            {menuGroups.flatMap(g => g.items).map(item => (
              <NavItem 
                key={item.id} 
                item={item} 
                active={view === item.id} 
                onClick={switchView} 
                isMobileView={true} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        marginLeft: isMobile ? '0' : sidebarCollapsed ? '72px' : '280px', 
        padding: isMobile ? '25px 15px' : '40px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        transition: 'margin-left 0.3s ease'
      }}>
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'flex-start', 
          marginBottom: isMobile ? '30px' : '48px',
          gap: isMobile ? '20px' : '0'
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, marginBottom: '8px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {view.replace('settings-', '').toUpperCase()}
              <div className="live-pulse-dot" title="Live Connection" />
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Management control panel for PK PROMPT KING systems.</p>
          </div>
          {['prompts', 'listicles', 'blogs', 'categories', 'website_categories', 'authors', 'faqs'].includes(view) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {selectedKeys.length > 0 && (view === 'prompts' || view === 'listicles') && (
                <>
                  <ActionButton label={`DELETE (${selectedKeys.length})`} color="var(--accent-main)" icon={<Trash size={18} />} onClick={handleBulkDelete} />
                </>
              )}
              {['prompts', 'listicles', 'blogs', 'categories', 'website_categories', 'authors', 'faqs'].includes(view) && !isDragMode && (
                <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : '200px' }}>
                  <input
                    type="text"
                    placeholder={`Search ${view}...`}
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    style={{
                      ...inputStyle,
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px'
                    }}
                  />
                </div>
              )}
              {view === 'prompts' && !isDragMode && (
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option style={{background: '#111'}} value="default">Default Order</option>
                  <option style={{background: '#111'}} value="views_desc">Most Views</option>
                  <option style={{background: '#111'}} value="copies_desc">Most Copies</option>
                </select>
              )}
              {view === 'prompts' && (
                isDragMode ? (
                  <>
                    <ActionButton
                      label={isSavingOrder ? 'SAVING...' : 'SAVE ORDER'}
                      color="#10a37f"
                      icon={<ChevronRight size={18} />}
                      onClick={handleSaveOrder}
                    />
                    <ActionButton
                      label="CANCEL"
                      color="rgba(255,255,255,0.1)"
                      icon={<Crown size={18} />}
                      onClick={() => { setIsDragMode(false); fetchData('prompts'); }}
                    />
                  </>
                ) : (
                  <ActionButton
                    label="REORDER"
                    color="rgba(59,130,246,0.8)"
                    icon={<Layers size={18} />}
                    onClick={() => { setIsDragMode(true); setSelectedKeys([]); setAdminSearch(''); }}
                  />
                )
              )}
              {!isDragMode && <ActionButton label="CREATE" icon={<Plus size={18} />} onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />}
            </div>
          )}
        </motion.header>

        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" {...pageTransition}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                <StatCard label="Total Prompts" value={stats.prompts} color="#ff4d4d" icon={<TableProperties size={24} />} />
                <StatCard label="Total Views" value={stats.views} color="#10b981" icon={<Layers size={24} />} />
                <StatCard label="Total Copies" value={stats.copies} color="#3b82f6" icon={<Activity size={24} />} />
                <StatCard label="Total Unlocks" value={stats.unlocks} color="#fbbf24" icon={<Crown size={24} />} />
                <StatCard label="Total Blogs" value={stats.blogs} color="#a78bfa" icon={<Layout size={24} />} />
              </div>
              <div style={{ ...glassPanelStyle, padding: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                  <SectionTitle title="Engagement Analytics" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <select
                      value={analyticsDays}
                      onChange={(e) => setAnalyticsDays(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="7" style={{background: '#111'}}>Last 7 Days</option>
                      <option value="30" style={{background: '#111'}}>Last 30 Days</option>
                      <option value="90" style={{background: '#111'}}>Last 90 Days</option>
                      <option value="all" style={{background: '#111'}}>All Time</option>
                    </select>
                    <button
                      onClick={handleResetAnalytics}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: '0.2s',
                      }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      Reset Data
                    </button>
                  </div>
                </div>
                <div style={{ width: '100%', height: '400px', marginTop: '10px' }}>
                  {analyticsData.length === 0 ? (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '16px',
                      border: '1px dashed rgba(255,255,255,0.1)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}><PieChart size={48} color="rgba(255,255,255,0.3)" /></div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '1.1rem' }}>No analytics data yet</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', maxWidth: '320px', lineHeight: 1.6 }}>
                        Data will appear here once users start viewing, copying, and unlocking prompts on your site.
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCopy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorUnlock" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorView" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                        <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                          itemStyle={{ color: 'white', fontWeight: 700 }}
                          labelStyle={{ color: '#10b981', fontWeight: 900, marginBottom: '8px', fontSize: '1.1rem' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }} />
                        <Area type="monotone" dataKey="view" name="Views" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorView)" dot={{ r: 4, strokeWidth: 2, fill: '#000', stroke: '#10b981' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                        <Area type="monotone" dataKey="copy" name="Copies" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCopy)" dot={{ r: 4, strokeWidth: 2, fill: '#000', stroke: '#3b82f6' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
                        <Area type="monotone" dataKey="unlock" name="Unlocks" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorUnlock)" dot={{ r: 4, strokeWidth: 2, fill: '#000', stroke: '#fbbf24' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#fbbf24' }} />
                        <Brush dataKey="date" height={30} stroke="rgba(255,255,255,0.2)" fill="rgba(0,0,0,0.5)" tickFormatter={(tick) => tick} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'settings-branding' && <BrandingPanel key="branding" onSave={() => fetchData('settings')} isMobile={isMobile} />}
          {view === 'settings-ui' && <UIPanel key="ui" onSave={() => fetchData('settings')} isMobile={isMobile} />}
          {view === 'settings-social' && <SocialPanel key="social" onSave={() => fetchData('settings')} />}
          {view === 'settings-ads' && <AdsPanel key="ads" onSave={() => fetchData('settings')} />}



          {['prompts', 'listicles', 'blogs', 'authors', 'categories', 'website_categories', 'faqs'].includes(view) && (
            <motion.div key="list" {...pageTransition} style={{ ...glassPanelStyle, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {/* Loading skeleton — shown while fetching new tab data */}
              {isDataLoading && (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{
                      height: '64px', borderRadius: '12px',
                      opacity: 1 - i * 0.12
                    }} />
                  ))}
                </div>
              )}
              {/* Table content — hidden while loading to prevent stale data flash */}
              {!isDataLoading && isDragMode && view === 'prompts' && (
                <div style={{ padding: '12px 24px', background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>⠿ DRAG MODE ACTIVE</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>— Drag the handle icons to reorder prompts, then click SAVE ORDER</span>
                </div>
              )}
              {!isDataLoading && <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table style={{ minWidth: isMobile ? '600px' : '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                      {view === 'prompts' && (
                        <th style={{ padding: isMobile ? '16px' : '24px', width: '50px' }}>
                          {!isDragMode && (
                            <input type="checkbox" checked={filteredData.length > 0 && selectedKeys.length === filteredData.length} onChange={() => toggleSelectAll(filteredData)} style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent-main)' }} />
                          )}
                        </th>
                      )}
                      <th style={{ padding: isMobile ? '16px' : '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resource Title</th>
                      {(view === 'prompts' || view === 'blogs') && <th style={{ padding: isMobile ? '16px' : '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>}
                      {view === 'prompts' && <th style={{ padding: isMobile ? '16px' : '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</th>}
                      <th style={{ padding: isMobile ? '16px' : '24px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view === 'prompts' && isDragMode ? (
                      <SortableContext items={data.map(i => i.prompt_key)} strategy={verticalListSortingStrategy}>
                        {data.map(item => (
                          <SortableRow
                            key={item.prompt_key}
                            item={item}
                            isSelected={selectedKeys.includes(item.prompt_key)}
                            onToggleSelect={toggleSelect}
                            onEdit={(i) => { setEditingItem(i); setIsModalOpen(true); }}
                            onDelete={handleDelete}
                            onToggleFeatured={handleToggleFeatured}
                            isMobile={isMobile}
                            isDragMode={isDragMode}
                          />
                        ))}
                      </SortableContext>
                    ) : (
                      filteredData.map((item, idx) => (
                        <motion.tr key={idx} variants={itemVariants} initial="hidden" animate="visible" exit="hidden" custom={idx} onContextMenu={(e) => handleContextMenu(e, item)} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: selectedKeys.includes(item.prompt_key || item.id) ? 'rgba(229, 9, 20, 0.03)' : 'transparent' }}>
                          {view === 'prompts' && (
                            <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
                              <input type="checkbox" checked={selectedKeys.includes(item.prompt_key || item.id)} onChange={() => toggleSelect(item.prompt_key || item.id)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-main)' }} />
                            </td>
                          )}
                          <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {view === 'prompts' && item.img_after && (
                                <img 
                                  src={item.img_after} 
                                  alt={item.title || 'Result'} 
                                  className="admin-thumb-hover"
                                  style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} 
                                  onError={e => e.target.style.display = 'none'} 
                                />
                              )}
                              {view === 'authors' && (
                                (item.image && item.image !== 'null' && item.image !== 'undefined') ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name || 'Author'} 
                                    className="admin-thumb-hover"
                                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, backgroundColor: 'var(--accent-main)' }} 
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><rect width='50' height='50' fill='%23E50914'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-family='sans-serif' font-size='24' font-weight='bold' fill='white'>${(item.name || 'A').charAt(0).toUpperCase()}</text></svg>`;
                                    }} 
                                  />
                                ) : (
                                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', flexShrink: 0, color: 'white' }}>
                                    {(item.name || 'A').charAt(0).toUpperCase()}
                                  </div>
                                )
                              )}
                              {view === 'blogs' && item.featured_image && (
                                <img 
                                  src={item.featured_image} 
                                  alt={item.title || 'Blog'} 
                                  className="admin-thumb-hover"
                                  style={{ width: '72px', height: '54px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} 
                                  onError={e => e.target.style.display = 'none'} 
                                />
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{item.prompt_key || item.title || item.name}</div>
              {item.publish_date && new Date(item.publish_date) > new Date() && <span style={{ fontSize: '0.65rem', color: '#3b82f6', border: '1px solid #3b82f6', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', marginLeft: '4px' }}>SCHEDULED</span>}
                                  {view === 'prompts' && item.is_featured && <span style={{ fontSize: '0.65rem', color: '#fff', background: 'rgba(229, 9, 20, 0.8)', border: '1px solid rgba(229, 9, 20, 1)', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', fontWeight: 'bold' }}>FEATURED</span>}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || item.question || item.slug}</div>
                              </div>
                            </div>
                          </td>
                          {(view === 'prompts' || view === 'blogs') && (
                            <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {view === 'prompts' && (
                                  <span
                                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(item, 'is_premium'); }}
                                    title="Click to toggle PRO / FREE"
                                    style={{
                                      padding: '4px 8px',
                                      background: item.is_premium ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                                      color: item.is_premium ? '#fbbf24' : 'var(--text-secondary)',
                                      border: item.is_premium ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                      borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                                      cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s'
                                    }}
                                  >{item.is_premium ? 'PRO' : 'FREE'}</span>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }} title="Times Opened (Views)">
                                  <Eye size={12} /> {item.view_count || 0}
                                </div>
                                {view === 'prompts' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,163,127,0.1)', color: '#10a37f', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }} title="Times Copied">
                                    <Copy size={12} /> {item.copy_count || 0}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                          {view === 'prompts' && (
                            <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
                              {item.is_premium ? (
                                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#fbbf24', letterSpacing: '2px', background: 'rgba(251,191,36,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                  {item.password || '----'}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                          )}
                          <td style={{ padding: isMobile ? '16px' : '20px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {view === 'prompts' && (
                                <div
                                  onClick={() => handleToggleFeatured(item)}
                                  title={item.is_featured ? 'Unfeature this prompt' : 'Feature this prompt'}
                                  style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: item.is_featured ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: item.is_featured ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: item.is_featured ? '0 0 10px rgba(255,215,0,0.2)' : 'none'
                                  }}
                                >
                                  <StarIcon filled={item.is_featured} size={14} />
                                </div>
                              )}
                              <div onClick={() => { setEditingItem(item); setIsModalOpen(true); }} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit size={14} color="var(--text-dim)" /></div>
                              <div onClick={() => handleDelete(item)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(229, 9, 20, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash size={14} color="var(--accent-main)" /></div>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </DndContext>}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* PromptModal is now handled by an early return at the top of this component */}
      {isModalOpen && view === 'blogs' && <BlogModal blog={editingItem} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(view); }} />}
      {isModalOpen && view === 'authors' && <AuthorModal author={editingItem} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(view); }} />}
      {isModalOpen && view === 'categories' && <CategoryModal category={editingItem} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(view); }} />}
      {isModalOpen && view === 'website_categories' && <WebsiteCategoryModal category={editingItem} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(view); }} />}
      {isModalOpen && view === 'faqs' && <FAQModal faq={editingItem} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(view); }} />}

      <KingDialog 
        isOpen={isKingDialogOpen} 
        onClose={() => setIsKingDialogOpen(false)} 
        title="Professional System Policy"
        footer={(
          <>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsKingDialogOpen(false)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'var(--text-dim)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsKingDialogOpen(false)}
              style={{
                padding: '10px 24px',
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--accent-glow)'
              }}
            >
              Understand & Proceed
            </motion.button>
          </>
        )}
      >
        <p>This is a demonstration of the <strong>KingDialog</strong> professional UI component. It features:</p>
        <ul style={{ marginTop: '12px', paddingLeft: '20px', display: 'grid', gap: '8px' }}>
          <li>Smooth <strong>Framer Motion</strong> enter/exit transitions</li>
          <li>Backdrop blur and premium glassmorphic styling</li>
          <li>Responsive design with adaptive padding</li>
          <li>High-contrast typography for maximum readability</li>
          <li>Subtle HSL-based brand accentuation</li>
        </ul>
      </KingDialog>
    </div>
  );
};

export default AdminDashboard;


