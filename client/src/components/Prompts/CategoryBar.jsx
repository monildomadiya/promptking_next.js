import React, { useRef } from 'react';
import { Sparkles, Crown, Zap, Image, Heart, Grid, Layout } from '../Common/Icons';

const CategoryBar = ({ filter, setFilter, categories, counts, user }) => {
  const scrollRef = useRef(null);

  const isActive = (val) => filter === val;

  const FilterChip = ({ label, value, icon: Icon, count }) => (
    <button
      onClick={() => setFilter(isActive(value) ? 'all' : value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        borderRadius: '100px',
        background: isActive(value) ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.05)',
        border: '1px solid ' + (isActive(value) ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.1)'),
        color: isActive(value) ? 'white' : 'var(--text-dim)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: isActive(value) ? 700 : 600,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isActive(value) ? '0 8px 20px var(--accent-glow)' : 'none'
      }}
    >
      {Icon && <Icon size={14} color={isActive(value) ? 'white' : 'currentColor'} />}
      <span>{label}</span>
      {count !== undefined && (
        <span style={{ 
          fontSize: '0.7rem', 
          opacity: 0.6,
          background: isActive(value) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          padding: '2px 6px',
          borderRadius: '6px'
        }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div style={{
      width: '100%',
      marginBottom: '20px',
      position: 'sticky',
      top: '0',
      zIndex: 100,
      background: 'var(--surface-0)',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div 
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          padding: '5px 15px 15px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none'
        }}
        className="no-scrollbar"
      >
        {/* Filter Trigger Button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openFilters'))}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'var(--accent-glow)',
            border: '1px solid var(--accent-main)',
            color: 'white',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 4px 15px var(--accent-glow)'
          }}
        >
          <Layout size={18} />
        </button>

        <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 5px', flexShrink: 0 }} />

        <FilterChip label="All" value="all" icon={Grid} count={counts.all} />
        <FilterChip label="Free" value="free" icon={Sparkles} count={counts.free} />
        <FilterChip label="Premium" value="premium" icon={Crown} count={counts.premium} />
        {user && <FilterChip label="Liked" value="liked" icon={Heart} count={counts.liked} />}
        
        <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 5px' }} />
        
        {categories.map((cat) => (
          <FilterChip 
            key={cat.id}
            label={cat.name}
            value={cat.name.toLowerCase()}
            count={counts.categories?.[cat.name.toLowerCase()] || 0}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryBar;
