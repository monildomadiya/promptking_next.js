import React, { useState, useEffect, useRef } from 'react';
import PromptCard from './PromptCard';
import SocialSidebar from './SocialSidebar';
import CategorySidebar from './CategorySidebar';
import api from '../../api';
import { Search, Crown, Grid, MessageSquare, Sparkles, Image, Zap, Heart, Filter } from 'lucide-react';

const PromptList = ({ user, search, filter, setFilter, showFilters, isMobile }) => {
  const [prompts, setPrompts] = useState([]);
  const [likes, setLikes] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeUnlockedKey, setActiveUnlockedKey] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
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
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.prompt_key.toLowerCase().includes(search.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'liked') {
      matchesFilter = likes[p.prompt_key];
    } else if (filter === 'free') {
      matchesFilter = !p.isPremium;
    } else if (filter === 'premium') {
      matchesFilter = p.isPremium;
    } else if (filter !== 'all') {
      matchesFilter = p.aiType.toLowerCase().includes(filter);
    }
    
    return matchesSearch && matchesFilter;
  });

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
                  <div key={item} className="skeleton-card masonry-grid-item" style={{ 
                    background: 'var(--surface-color)', borderRadius: '20px', padding: '18px', marginBottom: 0
                  }}>
                    <div className="skeleton" style={{ height: '200px', borderRadius: '20px 20px 0 0', marginBottom: '15px' }}></div>
                    <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '10px' }}></div>
                    <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
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
          <div className="social-sidebar skeleton" style={{ height: '500px', borderRadius: '32px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', width: '100%' }}>
      {/* Prompts Grid */}
      <div className="home-layout-grid">
        {/* Main Grid Content */}
        <div className="grid-main-area">
          {/* Category Filter Toggle - Smoothly hidden during search on mobile to prevent layout jumps */}
          <div className="category-filter-wrapper" style={{ 
            marginBottom: (isMobile && search.trim() !== '') ? '0' : '20px',
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center',
            position: 'relative',
            height: (isMobile && search.trim() !== '') ? '0' : '45px',
            opacity: (isMobile && search.trim() !== '') ? 0 : 1,
            pointerEvents: (isMobile && search.trim() !== '') ? 'none' : 'auto',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  style={{
                    background: isFilterOpen ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    padding: isMobile ? '8px 18px' : '10px 24px',
                    borderRadius: '50px',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '6px' : '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Filter size={isMobile ? 14 : 18} />
                  {filter === 'all' ? 'All Categories' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>

                {isFilterOpen && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 15px)', 
                    right: 0, 
                    zIndex: 1000
                  }}>
                    <CategorySidebar 
                      filter={filter} 
                      setFilter={(newFilter) => {
                        setFilter(newFilter);
                        setIsFilterOpen(false);
                      }} 
                      user={user} 
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="masonry-grid-react" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {(() => {
              const items = filteredPrompts.slice(0, visibleCount);
              const cols = isMobile ? 2 : 3;
              const columns = Array.from({ length: cols }, () => []);
              
              items.forEach((p, index) => {
                columns[index % cols].push(
                  <div key={p.prompt_key || p.id} style={{ marginBottom: 0 }}>
                    <PromptCard 
                      prompt={p} 
                      user={user}
                      isLiked={!!likes[p.prompt_key || p.id]} 
                      onLikeToggle={toggleLike}
                      isUnlocked={!p.isPremium || activeUnlockedKey === (p.prompt_key || p.id)}
                      onUnlock={() => setActiveUnlockedKey(p.prompt_key || p.id)}
                      onLock={() => setActiveUnlockedKey(null)}
                      isHighlighted={search.trim() !== '' && (
                        p.prompt_key?.toLowerCase() === search.trim().toLowerCase() ||
                        (search.trim().length >= 3 && p.prompt_key?.toLowerCase().includes(search.trim().toLowerCase()))
                      )}
                      searchTerm={search}
                    />
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

          {filteredPrompts.length > visibleCount && (
            <div className="load-more-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', marginBottom: '20px' }}>
              <button 
                onClick={loadMore}
                className="pro-card-hover"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  padding: '18px 48px',
                  borderRadius: '100px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  letterSpacing: '0.5px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                }}
              >
                <Sparkles size={20} className="floating-animation" style={{ color: 'var(--accent-main)' }} />
                Load More Amazing Prompts
              </button>
            </div>
          )}

          {filteredPrompts.length === 0 && (
            <p style={{ color: 'gray', textAlign: 'center', padding: '100px 40px', background: 'var(--surface-color)', borderRadius: '32px', marginTop: '40px' }}>No prompts found matching your criteria.</p>
          )}
        </div>

        {/* Sidebar Area */}
        <div className="sidebar-area" style={{ flexShrink: 0 }}>
          <SocialSidebar />
        </div>
      </div>
    </div>
  );
};

export default PromptList;
