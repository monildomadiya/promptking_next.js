import React, { useState, useEffect, useRef } from 'react';
import PromptCard from './PromptCard';
import MagicKingIntro from './MagicKingIntro';
import SocialSidebar from './SocialSidebar';
import CategorySidebar from './CategorySidebar';
import Shimmer from '../Common/Shimmer';
import CategoryBar from './CategoryBar';
import api from '../../api';
import { Search, Crown, Grid, MessageSquare, Sparkles, Image, Zap, Filter, X } from '../Common/Icons';

const PromptList = ({ search, filter, setFilter, showFilters, isMobile }) => {
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUnlockedKey, setActiveUnlockedKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
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
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/get_data');
      setPrompts(response.data.prompts);
      setCategories(response.data.categories || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch prompts", error);
      setLoading(false);
    }
  };



  const filteredPrompts = prompts.filter(p => {
    const safeKey = (p.prompt_key || '').toLowerCase();
    const safeSearch = (search || '').toLowerCase();
    
    const matchesSearch = safeKey.includes(safeSearch);
    
    let matchesFilter = true;
    if (filter === 'free') {
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
    categories: categories.reduce((acc, cat) => {
      const catName = (cat.name || '').toLowerCase();
      acc[catName] = prompts.filter(p => (p.aiType || '').toLowerCase().includes(catName)).length;
      return acc;
    }, {})
  };

  useEffect(() => {
    const handleOpenFilters = () => setIsSidebarOpen(true);
    const handleReset = () => {
      setCurrentPage(1);
      setActiveUnlockedKey(null);
    };
    window.addEventListener('openFilters', handleOpenFilters);
    window.addEventListener('resetPagination', handleReset);
    return () => {
      window.removeEventListener('openFilters', handleOpenFilters);
      window.removeEventListener('resetPagination', handleReset);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '10px' : '0 20px', width: '100%' }}>
      <div className="home-layout-grid" style={{ 
        display: isMobile ? 'flex' : 'grid', 
        flexDirection: 'column' 
      }}>
        <div className="grid-main-area" style={{ width: '100%' }}>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openFilters'))}
                aria-label="Open filter menu"
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
            marginTop: search ? '20px' : '0',
            flexWrap: 'nowrap',
            flexDirection: 'row'
          }}>
            {(() => {
              const items = filteredPrompts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
              const cols = isMobile ? 2 : 3;
              const columns = Array.from({ length: cols }, () => []);
              
              items.forEach((p, index) => {
                columns[index % cols].push(
                  <div key={p.prompt_key || p.id} style={{ width: '100%' }}>
                    <PromptCard 
                      prompt={p} 
                      isUnlocked={!p.isPremium || activeUnlockedKey === (p.prompt_key || p.id)}
                      onUnlock={() => setActiveUnlockedKey(p.prompt_key || p.id)}
                      onLock={() => setActiveUnlockedKey(null)}
                      searchTerm={search}
                      isHighlighted={search && p.prompt_key && p.prompt_key.toLowerCase().includes(search.toLowerCase())}
                      isPriority={index < 2}
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

          <MagicKingIntro isMobile={isMobile} />

          {filteredPrompts.length > itemsPerPage && (
            <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : 'white',
                  padding: isMobile ? '8px 12px' : '8px 16px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Prev
              </button>
              
              {Array.from({ length: Math.ceil(filteredPrompts.length / itemsPerPage) }).map((_, idx) => {
                const pageNum = idx + 1;
                const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
                
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: currentPage === pageNum ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        padding: isMobile ? '8px 12px' : '8px 14px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: currentPage === pageNum ? '0 0 15px rgba(229, 9, 20, 0.4)' : 'none',
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 || 
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} style={{ color: 'rgba(255,255,255,0.5)', padding: '0 4px', fontSize: '0.9rem' }}>...</span>;
                }
                return null;
              })}

              <button 
                onClick={() => {
                  setCurrentPage(p => Math.min(Math.ceil(filteredPrompts.length / itemsPerPage), p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === Math.ceil(filteredPrompts.length / itemsPerPage)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage === Math.ceil(filteredPrompts.length / itemsPerPage) ? 'rgba(255,255,255,0.3)' : 'white',
                  padding: isMobile ? '8px 12px' : '8px 16px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: currentPage === Math.ceil(filteredPrompts.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="sidebar-area" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '30px', width: '300px', position: 'sticky', top: '100px', height: 'fit-content' }}>
            <CategorySidebar 
              filter={filter} 
              setFilter={setFilter} 
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
