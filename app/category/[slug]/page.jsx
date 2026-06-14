"use client";
import React, { useState, useEffect } from 'react';

import { useParams } from 'next/navigation';
import Link from 'next/link';


import api from '@/lib/api';
import PromptCard from '@/components/Prompts/PromptCard';

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get(`/category/${slug}`);
        setCategory(res.data.category);
        setPrompts(res.data.prompts || []);
      } catch (err) {
        console.error("Error fetching category:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryData();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-main)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h2>Category Not Found</h2>
        <Link href="/" style={{ marginTop: '20px', color: 'var(--accent-main)' }}>Return to Home</Link>
      </div>
    );
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.meta_title || category.name,
    "description": category.meta_description || category.description,
    "url": `https://promptking.in/category/${category.slug}`
  };

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px', color: 'white', maxWidth: '1400px', margin: '0 auto' }}>
      

      {/* Category Header */}
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(229, 9, 20, 0.1) 0%, transparent 100%)',
        padding: '60px 20px', borderRadius: '30px', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {category.tag && (
          <span style={{ 
            background: 'var(--accent-main)', color: 'white', fontSize: '0.75rem', fontWeight: 800, 
            padding: '6px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px'
          }}>
            {category.tag}
          </span>
        )}
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-1px' }}>
          {category.name}
        </h1>
        {category.description && (
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: '700px', lineHeight: '1.6' }}>
            {category.description}
          </p>
        )}
      </div>

      {/* Prompts Grid */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          Explore Prompts ({prompts.length})
        </h2>
        
        {prompts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '25px',
            width: '100%'
          }}>
            {prompts.map(prompt => (
              <PromptCard key={prompt.prompt_key} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontSize: '1.2rem' }}>No prompts found in this category yet.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default CategoryPage;
