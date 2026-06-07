import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Settings, LogOut, Layout, FileText, Layers } from '../Common/Icons';

const CommandPalette = ({ isOpen, onClose, onAction, data, activeView }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const defaultActions = [
    { id: 'action-new-prompt', title: 'Create New Prompt', icon: <Plus size={16} />, action: () => onAction('NEW_PROMPT') },
    { id: 'action-new-blog', title: 'Create New Blog', icon: <FileText size={16} />, action: () => onAction('NEW_BLOG') },
    { id: 'action-settings', title: 'Go to Settings', icon: <Settings size={16} />, action: () => onAction('NAV_SETTINGS') },
    { id: 'action-branding', title: 'Go to Branding', icon: <Layout size={16} />, action: () => onAction('NAV_BRANDING') },
    { id: 'action-reset', title: 'Reset Analytics', icon: <Layers size={16} color="#fbbf24" />, action: () => onAction('RESET_ANALYTICS') },
    { id: 'action-logout', title: 'Log Out', icon: <LogOut size={16} color="#ef4444" />, action: () => onAction('LOGOUT') },
  ];

  // Search logic
  const normalizedQuery = query.toLowerCase().trim();
  let filteredItems = [];

  if (normalizedQuery) {
    // Actions match
    filteredItems = defaultActions.filter(a => a.title.toLowerCase().includes(normalizedQuery));
    
    // Data match (prompts, blogs, etc.)
    if (data && Array.isArray(data)) {
      const dataMatches = data.filter(item => {
        const title = (item.title || item.name || item.question || '').toLowerCase();
        const key = (item.prompt_key || item.slug || '').toLowerCase();
        return title.includes(normalizedQuery) || key.includes(normalizedQuery);
      }).map(item => ({
        id: `data-${item.prompt_key || item.id}`,
        title: item.title || item.name || item.question,
        subtitle: item.prompt_key || item.slug,
        icon: activeView === 'prompts' ? <Search size={16} /> : <FileText size={16} />,
        action: () => onAction('EDIT_ITEM', item)
      }));
      filteredItems = [...filteredItems, ...dataMatches].slice(0, 8); // Max 8 results
    }
  } else {
    filteredItems = defaultActions;
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="glass-overlay" 
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}
        >
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              width: '100%', maxWidth: '600px', 
              background: 'rgba(15, 15, 20, 0.85)', 
              backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
            }}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Search size={20} color="var(--text-dim)" />
              <input 
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search prompts, blogs, or type a command..."
                style={{ 
                  flex: 1, background: 'transparent', border: 'none', color: 'white', 
                  fontSize: '1.1rem', padding: '0 16px', outline: 'none'
                }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>ESC</div>
            </div>

            {/* Results List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <div 
                    key={item.id}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => item.action()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                      background: selectedIndex === idx ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderLeft: selectedIndex === idx ? '3px solid var(--accent-main)' : '3px solid transparent',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: selectedIndex === idx ? 'white' : 'var(--text-secondary)' }}>{item.title}</div>
                      {item.subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>{item.subtitle}</div>}
                    </div>
                    {selectedIndex === idx && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Enter ↵</div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <Search size={32} style={{ opacity: 0.2, margin: '0 auto 10px auto' }} />
                  <div>No results found for "{query}"</div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', gap: '10px' }}>
                <span><span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>↑</span> <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>↓</span> Navigate</span>
                <span><span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>↵</span> Select</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
