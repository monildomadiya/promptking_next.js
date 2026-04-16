import React, { useState, useEffect } from 'react';
import api from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Table, Edit, Trash, Plus, Settings, FileText, 
  TableProperties, LogOut, ChevronRight, Layout, 
  Share2, Palette, Activity, Users, Layers, Crown
} from '../Common/Icons';
import PromptModal from './PromptModal';
import BlogModal from './BlogModal';
import FAQModal from './FAQModal';
import CategoryModal from './CategoryModal';
import KingDialog from '../Modals/KingDialog';

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
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '20px',
};

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  color: 'white',
  fontSize: '0.95rem',
  transition: 'var(--transition-fast)',
  outline: 'none',
};

// --- COMPONENTS ---

const NavItem = ({ item, active, onClick, isMobileView }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(item.id)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: isMobileView ? '10px 18px' : '12px 16px',
      borderRadius: '12px',
      cursor: 'pointer',
      marginBottom: isMobileView ? '0' : '4px',
      fontWeight: 700,
      fontSize: '0.85rem',
      transition: 'var(--transition-fast)',
      color: active ? 'white' : 'var(--text-dim)',
      background: active ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${active ? 'rgba(229, 9, 20, 0.3)' : 'rgba(255,255,255,0.05)'}`,
      position: 'relative',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}
  >
    <span style={{ color: active ? 'var(--accent-main)' : 'inherit', display: 'flex', alignItems: 'center' }}>
      {item.icon}
    </span>
    <span>{item.label}</span>
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
    whileHover={{ y: -5, boxShadow: 'var(--shadow-md)' }}
    style={{
      ...glassCardStyle,
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
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

const BrandingPanel = ({ onSave }) => {
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
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      alert("Branding settings applied!");
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

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 1024 ? '350px 1fr' : '1fr', gap: '25px' }}>
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
                         alert("Logo uploaded successfully!");
                       }
                     } catch (err) {
                       console.error(err);
                       alert("Failed to upload logo.");
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
              border: '2px solid rgba(229,9,20,0.2)', display: 'flex', alignItems: 'center', 
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
      alert("Social links updated!");
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

const LayoutPanel = () => (
  <motion.div {...pageTransition} style={{ ...glassPanelStyle, padding: '32px', textAlign: 'center' }}>
    <Layers size={48} style={{ margin: '40px auto 20px', color: 'var(--accent-main)', opacity: 0.3 }} />
    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Advanced Layout Engine</h3>
    <p style={{ color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 40px' }}>
      Fine-grained control over header heights, spacing modules, and responsive breakpoints is currently in development.
    </p>
    <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent-glow), transparent)', width: '200px', margin: '0 auto' }} />
  </motion.div>
);

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
      alert("Ads configuration updated! Changes may take a moment to propagate.");
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
          </div>
          <Hint text="Leave blank to disable specific placements." />
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
  const [stats, setStats] = useState({ prompts: 0, copies: 0, unlocks: 0, likes: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKingDialogOpen, setIsKingDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [settings, setSettings] = useState({});
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1100);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { 
    checkAuth(); 
    api.get('/admin/settings').then(res => setSettings(res.data));
  }, []);

  useEffect(() => {
    setSelectedKeys([]);
    setAdminSearch('');
  }, [view]);

  const checkAuth = async () => {
    try {
      const response = await api.get('/admin/check_auth');
      setIsAdmin(response.data.isAdmin);
      if (response.data.isAdmin) fetchData('prompts');
    } catch (e) { console.error(e); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/login', { password });
      if (response.data && response.data.error) {
        alert(response.data.error);
        return;
      }
      if (response.data && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        setIsAdmin(true);
        fetchData('prompts');
      } else {
        alert("Authentication failed.");
      }
    } catch (e) { 
      alert("Network or authentication error."); 
    }
  };

  const handleLogout = async () => {
    await api.get('/admin/logout');
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
  };

  const fetchData = async (currentView) => {
    if (currentView === 'settings') return;
    try {
      const endpoint = currentView === 'settings' ? 'settings' : currentView;
      const response = await api.get(`/admin/${endpoint}`);
      setData(response.data);
      if (currentView === 'prompts') {
        const calculateTotal = (key) => response.data.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0);
        setStats({
          prompts: response.data.length,
          copies: calculateTotal('copy_count'),
          unlocks: calculateTotal('unlock_count'),
          likes: calculateTotal('like_count'),
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Permanent delete? This cannot be undone.")) return;
    const id = item.prompt_key || item.id;
    const type = view === 'prompts' ? 'prompt' : (view === 'blogs' ? 'blog' : (view === 'categories' ? 'category' : 'faq'));
    try {
      await api.delete(`/admin/delete_${type}/${id}`);
      fetchData(view);
    } catch (err) {
      alert("Deletion failed. See console for details.");
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (view !== 'prompts') return;
    if (!window.confirm(`Delete ${selectedKeys.length} prompts permanently?`)) return;
    
    try {
      await api.post('/admin/delete_prompts_bulk', { keys: selectedKeys });
      setSelectedKeys([]);
      fetchData(view);
      alert("Bulk deletion successful.");
    } catch (err) {
      alert("Bulk deletion failed.");
      console.error(err);
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
    if (!adminSearch) return true;
    const search = adminSearch.toLowerCase();
    const promptKey = String(item.prompt_key || '').toLowerCase();
    const title = String(item.title || item.name || '').toLowerCase();
    const aiType = String(item.ai_type || item.aiType || '').toLowerCase();
    return promptKey.includes(search) || title.includes(search) || aiType.includes(search);
  }) : [];

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--surface-0)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ ...glassPanelStyle, padding: '48px', width: '400px', textAlign: 'center' }}>
          <div style={{ 
            width: '80px', height: '80px', background: 'rgba(229, 9, 20, 0.05)', 
            borderRadius: '24px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 24px', 
            border: '1px solid rgba(229, 9, 20, 0.2)',
            boxShadow: '0 0 30px rgba(229, 9, 20, 0.15)',
            color: 'var(--accent-main)' 
          }}>
            <Crown size={42} fill="currentColor" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px', fontFamily: 'var(--font-heading)', color: 'white' }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '32px', fontSize: '0.9rem', fontWeight: 500 }}>Authenticated Access Only</p>
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, textAlign: 'center', marginBottom: '24px', letterSpacing: '4px', fontSize: '1.2rem' }} placeholder="••••" />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%', padding: '16px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px var(--accent-glow)' }}>INITIALIZE ACCESS</motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  const menuGroups = [
    { title: 'CORE CONTENT', items: [
      { id: 'dashboard', label: 'Overview', icon: <Layout size={20} /> },
      { id: 'prompts', label: 'Prompts', icon: <TableProperties size={20} /> },
      { id: 'blogs', label: 'Articles', icon: <FileText size={20} /> },
      { id: 'categories', label: 'Categories', icon: <Layers size={20} /> },
      { id: 'faqs', label: 'Help Desk', icon: <Activity size={20} /> },
    ]},
    { title: 'SYSTEM CONFIG', items: [
      { id: 'settings-branding', label: 'Branding', icon: <Palette size={20} /> },
      { id: 'settings-social', label: 'Channels', icon: <Share2 size={20} /> },
      { id: 'settings-ads', label: 'Ads Management', icon: <Activity size={20} /> },
      { id: 'settings-layout', label: 'Layout', icon: <Layers size={20} /> },
    ]}
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh', 
      background: 'var(--surface-0)', 
      color: 'white',
      overflowX: 'hidden'
    }}>
      {/* Sidebar (Desktop Only) */}
      {!isMobile && (
        <motion.aside initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ width: '280px', background: 'var(--surface-1)', borderRight: '1px solid var(--glass-border)', padding: '32px 24px', position: 'fixed', height: '100vh', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', width: '100%', padding: '0 10px' }}>
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                className="animated-logo"
                style={{ height: '90px', maxWidth: '100%', objectFit: 'contain' }} 
                alt="Logo" 
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="animated-logo" style={{ width: '45px', height: '45px', background: 'var(--accent-gradient)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>PK</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px', fontFamily: 'var(--font-heading)' }}>KING ADMIN</h2>
              </div>
            )}
          </div>

          <motion.nav variants={containerVariants} initial="hidden" animate="visible" style={{ flex: 1 }}>
            {menuGroups.map((group, idx) => (
              <div key={idx} style={{ marginBottom: '32px' }}>
                <div style={{ paddingLeft: '16px', marginBottom: '16px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px' }}>{group.title}</div>
                {group.items.map(item => (
                  <NavItem key={item.id} item={item} active={view === item.id} onClick={(id) => { setView(id); fetchData(id.startsWith('settings') ? 'settings' : id); }} isMobileView={false} />
                ))}
              </div>
            ))}
          </motion.nav>

          <div onClick={handleLogout} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', color: 'var(--text-dim)', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
            <LogOut size={20} /> <span style={{ fontWeight: 600 }}>Sign Out</span>
          </div>
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
                onClick={(id) => { setView(id); fetchData(id.startsWith('settings') ? 'settings' : id); }} 
                isMobileView={true} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        marginLeft: isMobile ? '0' : '280px', 
        padding: isMobile ? '25px 15px' : '40px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
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
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
              {view.replace('settings-', '').toUpperCase()}
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Management control panel for PK PROMPT KING systems.</p>
          </div>
          {['prompts', 'blogs', 'categories', 'faqs'].includes(view) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {selectedKeys.length > 0 && view === 'prompts' && (
                <ActionButton 
                  label={`DELETE (${selectedKeys.length})`} 
                  color="var(--accent-main)" 
                  icon={<Trash size={18} />} 
                  onClick={handleBulkDelete} 
                />
              )}
              {['prompts', 'blogs', 'categories', 'faqs'].includes(view) && (
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
              <ActionButton label="CREATE" icon={<Plus size={18} />} onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />
            </div>
          )}
        </motion.header>

        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" {...pageTransition}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                <StatCard label="Total Prompts" value={stats.prompts} color="#ff4d4d" icon={<TableProperties size={24} />} />
                <StatCard label="Copy Interactions" value={stats.copies} color="#3b82f6" icon={<Activity size={24} />} />
                <StatCard label="Unlocks Generated" value={stats.unlocks} color="#fbbf24" icon={<Layers size={24} />} />
                <StatCard label="Social Likes" value={stats.likes} color="#ec4899" icon={<Activity size={24} />} />
              </div>
              <div style={{ ...glassPanelStyle, padding: '40px', textAlign: 'center' }}>
                <Activity size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Analytics Engine</h3>
                <p style={{ color: 'var(--text-dim)' }}>Live traffic and conversion metrics integration is in progress.</p>
              </div>
            </motion.div>
          )}

          {view === 'settings-branding' && <BrandingPanel key="branding" onSave={() => fetchData('settings')} />}
          {view === 'settings-social' && <SocialPanel key="social" onSave={() => fetchData('settings')} />}
          {view === 'settings-ads' && <AdsPanel key="ads" onSave={() => fetchData('settings')} />}
          {view === 'settings-layout' && <LayoutPanel key="layout" />}

          {['prompts', 'blogs', 'categories', 'faqs'].includes(view) && (
            <motion.div key="list" {...pageTransition} style={{ 
              ...glassPanelStyle, 
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{ minWidth: isMobile ? '600px' : '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                    {view === 'prompts' && (
                      <th style={{ padding: isMobile ? '16px' : '24px', width: '50px' }}>
                        <input 
                          type="checkbox" 
                          checked={filteredData.length > 0 && selectedKeys.length === filteredData.length} 
                          onChange={() => toggleSelectAll(filteredData)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent-main)' }}
                        />
                      </th>
                    )}
                    <th style={{ padding: isMobile ? '16px' : '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resource Title</th>
                    {view === 'prompts' && <th style={{ padding: isMobile ? '16px' : '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>}
                    <th style={{ padding: isMobile ? '16px' : '24px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, idx) => (
                    <motion.tr key={idx} variants={itemVariants} initial="hidden" animate="visible" exit="hidden" custom={idx} style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: selectedKeys.includes(item.prompt_key || item.id) ? 'rgba(229, 9, 20, 0.03)' : 'transparent'
                    }}>
                      {view === 'prompts' && (
                        <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedKeys.includes(item.prompt_key || item.id)} 
                            onChange={() => toggleSelect(item.prompt_key || item.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-main)' }}
                          />
                        </td>
                      )}
                      <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{item.prompt_key || item.title || item.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || item.question || item.slug}</div>
                      </td>
                      {view === 'prompts' && (
                        <td style={{ padding: isMobile ? '16px' : '20px 24px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>{item.is_premium ? 'PRO' : 'FREE'}</span>
                            <span style={{ padding: '4px 8px', background: 'rgba(255,191,38,0.1)', color: '#fbbf24', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>{item.unlock_count || 0}</span>
                          </div>
                        </td>
                      )}
                      <td style={{ padding: isMobile ? '16px' : '20px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <div onClick={() => { setEditingItem(item); setIsModalOpen(true); }} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit size={14} color="var(--text-dim)" /></div>
                          <div onClick={() => handleDelete(item)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(229, 9, 20, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash size={14} color="var(--accent-main)" /></div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {isModalOpen && view === 'prompts' && <PromptModal prompt={editingItem} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(view); }} />}
      {isModalOpen && view === 'blogs' && <BlogModal blog={editingItem} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(view); }} />}
      {isModalOpen && view === 'categories' && <CategoryModal category={editingItem} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchData(view); }} />}
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
