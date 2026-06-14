"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Search, X, Filter, Sparkles, Crown, CheckCircle } from '../Common/Icons';
import api from '@/lib/api';

const CategorySidebar = ({ filter, setFilter, counts = {} }) => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data));
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const HighlightText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) return <span>{text}</span>;
    const parts = String(text).split(new RegExp(`(${highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
            <mark key={i} style={{ 
              background: 'rgba(229, 9, 20, 0.2)', 
              color: 'var(--accent-main)',
              padding: '0 2px',
              borderRadius: '4px',
              fontWeight: 800
            }}>{part}</mark> : part
        )}
      </span>
    );
  };

  const isActive = (val) => filter === val;

  const FilterGroup = ({ title, children }) => (
    <div style={{ marginBottom: '30px' }}>
      <h4 style={{ 
        fontSize: '0.75rem', 
        fontWeight: 800, 
        color: 'var(--text-dim)', 
        textTransform: 'uppercase', 
        letterSpacing: '1.5px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {children}
      </div>
    </div>
  );

  const FilterItem = ({ label, value, icon: Icon, count, onClick, to }) => {
    const Component = to ? Link : 'button';
    return (
    <Component 
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: '12px',
        background: isActive(value) ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        border: '1px solid ' + (isActive(value) ? 'rgba(255, 255, 255, 0.1)' : 'transparent'),
        color: isActive(value) ? 'white' : 'var(--text-dim)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        textAlign: 'left',
        textDecoration: 'none'
      }}
      onMouseOver={(e) => {
        if (!isActive(value)) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          e.currentTarget.style.color = 'white';
        }
      }}
      onMouseOut={(e) => {
        if (!isActive(value)) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-dim)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: '2px solid ' + (isActive(value) ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.2)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          background: isActive(value) ? 'var(--accent-main)' : 'transparent'
        }}>
          {isActive(value) && <CheckCircle size={12} color="white" />}
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: isActive(value) ? 600 : 500 }}>
          <HighlightText text={label} highlight={searchTerm} />
        </span>
      </div>
      {count !== undefined && (
        <span style={{ 
          fontSize: '0.75rem', 
          opacity: isActive(value) ? 1 : 0.5,
          fontWeight: 600,
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '2px 8px',
          borderRadius: '100px'
        }}>
          {count}
        </span>
      )}
    </Component>
    );
  };

  return (
    <div className="category-sidebar ecommerce-filter-ui" style={{ 
      padding: '24px', 
      borderRadius: '28px',
      background: 'rgba(15, 15, 15, 0.6)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      minWidth: '280px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    }}>
      {/* Search Header */}
      <div style={{ marginBottom: '25px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', margin: 0 }}>Filter</h3>
          {filter !== 'all' && (
            <Link 
              href="/"
              onClick={() => setFilter('all')}
              aria-label="Clear all filters"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-main)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(229, 9, 20, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              Clear All
            </Link>
          )}
        </div>

        {/* Category Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ 
            position: 'absolute', 
            left: '14px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--text-dim)' 
          }} />
          <input 
            type="text"
            placeholder="Search Categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '12px 14px 12px 42px',
              color: 'white',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.15)'}
            onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)'}
          />
          {searchTerm && (
            <X 
              size={14} 
              onClick={() => setSearchTerm('')}
              aria-label="Clear search term"
              style={{ 
                position: 'absolute', 
                right: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }} 
            />
          )}
        </div>
      </div>

      <FilterGroup title="Quick Filters">
        <FilterItem 
          label="All Prompts" 
          value="all" 
          count={counts.all} 
          onClick={() => setFilter('all')} 
          to="/"
        />
        <FilterItem 
          label="Free Access" 
          value="free" 
          count={counts.free} 
          onClick={() => setFilter('free')} 
          to="/"
        />
        <FilterItem 
          label="Premium King" 
          value="premium" 
          count={counts.premium} 
          onClick={() => setFilter('premium')} 
          to="/"
        />

      </FilterGroup>

      <FilterGroup title="By Category">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => {
            const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
            const isActiveCat = isActive(cat.name.toLowerCase());
            return (
              <FilterItem 
                key={cat.id}
                label={cat.name}
                value={cat.name.toLowerCase()}
                count={counts.categories?.[cat.name.toLowerCase()] || 0}
                onClick={() => setFilter(isActiveCat ? 'all' : cat.name.toLowerCase())}
                to={isActiveCat ? '/' : `/category/${catSlug}`}
              />
            );
          })
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '10px' }}>
            No categories match.
          </p>
        )}
      </FilterGroup>

      {/* Footer Info */}
      <div style={{ 
        marginTop: '20px', 
        paddingTop: '20px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ 
          padding: '8px', 
          borderRadius: '10px', 
          background: 'rgba(229, 9, 20, 0.1)', 
          color: 'var(--accent-main)' 
        }}>
          <Sparkles size={16} />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4, margin: 0 }}>
          New prompts added daily. <br />
          <strong>Happy Prompting!</strong>
        </p>
      </div>
    </div>
  );
};

export default CategorySidebar;

