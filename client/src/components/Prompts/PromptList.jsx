import React, { useState, useEffect, useRef } from 'react';
import PromptCard from './PromptCard';
import SocialSidebar from './SocialSidebar';
import CategorySidebar from './CategorySidebar';
import Shimmer from '../Common/Shimmer';
import CategoryBar from './CategoryBar';
import api from '../../api';
import { Search, Crown, Grid, MessageSquare, Sparkles, Image, Zap, Heart, Filter, X } from '../Common/Icons';

const PromptList = ({ user, search, filter, setFilter, showFilters, isMobile }) => {
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [likes, setLikes] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeUnlockedKey, setActiveUnlockedKey] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/get_data');
      setPrompts(response.data.prompts);
      setLikes(response.data.likes);
      setCategories(response.data.categories || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch prompts", error);
      setLoading(false);
    }
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  const toggleLike = async (key) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    try {
      const response = await api.post('/toggle_like', { key });
      setLikes(prev => ({
        ...prev,
        [key]: response.data.status === 'added'
      }));
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const safeTitle = (p.title || '').toLowerCase();
    const safeKey = (p.prompt_key || '').toLowerCase();
    const safeSearch = (search || '').toLowerCase();
    
    const matchesSearch = safeTitle.includes(safeSearch) || safeKey.includes(safeSearch);
    
    let matchesFilter = true;
    if (filter === 'liked') {
      matchesFilter = likes[p.prompt_key];
    } else if (filter === 'free') {
      matchesFilter = !p.isPremium;
    } else if (filter === 'premium') {
      matchesFilter = p.isPremium;
    } else if (filter !== 'all') {
      matchesFilter = (p.aiType || '').toLowerCase().includes(filter);
    }
    
    return matchesSearch && matchesFilter;
  });

  // Calculate counts for categories and types
  const filterCounts = {
    all: prompts.length,
    free: prompts.filter(p => !p.isPremium).length,
    premium: prompts.filter(p => p.isPremium).length,
    liked: Object.values(likes).filter(Boolean).length,
    categories: categories.reduce((acc, cat) => {
      const catName = (cat.name || '').toLowerCase();
      acc[catName] = prompts.filter(p => (p.aiType || '').toLowerCase().includes(catName)).length;
      return acc;
    }, {})
  };

  useEffect(() => {
    const handleOpenFilters = () => setIsSidebarOpen(true);
    window.addEventListener('openFilters', handleOpenFilters);
    return () => window.removeEventListener('openFilters', handleOpenFilters);
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', width: '100%' }}>
        <div className="home-layout-grid">
          <div className="masonry-grid-react" id="skeletonContainer" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {(() => {
              const items = [1, 2, 3, 4, 5, 6];
              const cols = isMobile ? 2 : 3;
              const columns = Array.from({ length: cols }, () => []);
              
              items.forEach((item, index) => {
                columns[index % cols].push(
                  <div key={item} className="masonry-grid-item" style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Shimmer height={isMobile ? '140px' : '180px'} borderRadius="20px 20px 0 0" style={{ margin: '-18px -18px 15px -18px', width: 'calc(100% + 36px)' }} />
                    <Shimmer height="20px" width="60%" style={{ marginBottom: '10px' }} />
                    <Shimmer height="140px" width="100%" borderRadius="20px" />
                  </div>
                );
              });

              return columns.map((colItems, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '25px', minWidth: 0 }}>
                  {colItems}
                </div>
              ));
            })()}
          </div>
          <div className="social-sidebar" style={{ width: '280px' }}>
             <Shimmer height="500px" borderRadius="32px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '10px' : '20px', width: '100%' }}>
      <div className="home-layout-grid" style={{ 
        display: isMobile ? 'flex' : 'grid', 
        flexDirection: 'column' 
      }}>
        <div className="grid-main-area" style={{ width: '100%' }}>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openFilters'))}
                className="glass-button-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  color: 'white',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Filter size={16} /> 
                <span style={{ fontWeight: 600 }}>Filter</span>
              </button>
            </div>
          )}
          <div className="masonry-grid-react" style={{ 
            display: 'flex', 
            gap: isMobile ? '12px' : '20px', 
            alignItems: 'flex-start',
            flexWrap: 'nowrap',
            flexDirection: 'row'
          }}>
            {(() => {
              const items = filteredPrompts.slice(0, visibleCount);
              const cols = isMobile ? 2 : 3;
              const columns = Array.from({ length: cols }, () => []);
              
              items.forEach((p, index) => {
                columns[index % cols].push(
                  <div key={p.prompt_key || p.id} style={{ width: '100%' }}>
                    <PromptCard 
                      prompt={p} 
                      user={user}
                      isLiked={!!likes[p.prompt_key || p.id]} 
                      onLikeToggle={toggleLike}
                      isUnlocked={!p.isPremium || activeUnlockedKey === (p.prompt_key || p.id)}
                      onUnlock={() => setActiveUnlockedKey(p.prompt_key || p.id)}
                      onLock={() => setActiveUnlockedKey(null)}
                      searchTerm={search}
                      isHighlighted={search && (p.title.toLowerCase().includes(search.toLowerCase()) || (p.prompt_key && p.prompt_key.toLowerCase().includes(search.toLowerCase())))}
                    />
                  </div>
                );
              });

              return columns.map((colItems, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '25px', minWidth: 0 }}>
                  {colItems}
                </div>
              ));
            })()}
          </div>

          {filteredPrompts.length > visibleCount && (
            <div className="load-more-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
              <button 
                onClick={loadMore}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  padding: isMobile ? '14px 30px' : '18px 48px',
                  borderRadius: '100px',
                  fontSize: isMobile ? '0.9rem' : '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Sparkles size={18} style={{ color: 'var(--accent-main)' }} />
                Load More
              </button>
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="sidebar-area" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '30px', width: '300px' }}>
            <CategorySidebar 
              filter={filter} 
              setFilter={setFilter} 
              user={user} 
              counts={filterCounts}
            />
            <SocialSidebar />
          </div>
        )}

        {isMobile && isSidebarOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'fadeIn 0.3s ease-out'
          }} onClick={() => setIsSidebarOpen(false)}>
            <div style={{
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--surface-0)',
              borderRadius: '32px 32px 0 0',
              padding: '20px 24px 40px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.9)',
              animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }} onClick={e => e.stopPropagation()}>
              
              {/* Close Button */}
              <button 
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close categories"
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '24px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  zIndex: 100,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <X size={20} />
              </button>
              
              {/* Drag Handle */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '25px',
                sticky: 'top',
                paddingTop: '5px'
              }}>
                <div style={{ 
                  width: '45px', 
                  height: '5px', 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  borderRadius: '10px' 
                }} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: '5px' }}>Controls</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '20px' }}>Configure your browsing experience.</p>
              </div>

              <CategorySidebar 
                filter={filter} 
                setFilter={(f) => {
                  setFilter(f);
                  // Optional: Close on selection for better UX
                  // setIsSidebarOpen(false); 
                }} 
                user={user} 
                counts={filterCounts}
              />

              <button 
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'var(--accent-main)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 800,
                  marginTop: '30px',
                  fontSize: '1rem',
                  boxShadow: '0 8px 25px var(--accent-glow)'
                }}
              >
                APPLY SETTINGS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptList;
