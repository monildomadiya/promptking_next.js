"use client";
import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, Search, MessageSquare } from '@/components/Common/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import Shimmer from '@/components/Common/Shimmer';
import SocialSidebar from '@/components/Prompts/SocialSidebar';
import SEOMetadata from '@/components/SEO/SEOMetadata';
import { getCache, setCache } from '@/utils/cacheUtils';

const pageVariants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0, transition: { duration: 0, staggerChildren: 0 } }
};

const itemVariants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 }
};

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    const cacheKey = 'pk_faq_list';
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      setFaqs(cachedData);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get('/faqs');
      setCache(cacheKey, response.data);
      setFaqs(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch FAQs", error);
      if (!cachedData) setLoading(false);
    }
  };

  const toggleAccordion = (id) => {
    const nextOpenIds = new Set(openIds);
    if (nextOpenIds.has(id)) nextOpenIds.delete(id);
    else nextOpenIds.add(id);
    setOpenIds(nextOpenIds);
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(filteredFaqs.map(f => f.category || 'General'))];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  if (loading) return (
    <div className="layout-with-sidebar">
      <div className="main-content-area">
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Shimmer height="80px" width="80px" borderRadius="24px" style={{ margin: '0 auto 25px' }} />
          <Shimmer height="60px" width="100%" style={{ maxWidth: '400px', margin: '0 auto 20px' }} />
          <Shimmer height="24px" width="100%" style={{ maxWidth: '600px', margin: '0 auto 40px' }} />
          <Shimmer height="60px" width="100%" borderRadius="20px" style={{ maxWidth: '500px', margin: '0 auto' }} />
        </header>

        <section style={{ marginBottom: '60px' }}>
          <Shimmer height="35px" width="200px" style={{ marginBottom: '30px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[1, 2, 3, 4].map(i => (
              <Shimmer key={i} height="100px" borderRadius="24px" />
            ))}
          </div>
        </section>
      </div>
      <div className="social-sidebar">
        <Shimmer height="600px" borderRadius="32px" />
      </div>
    </div>
  );

  return (
    <div className="layout-with-sidebar">
      <SEOMetadata 
        title="FAQ - Frequently Asked Questions | PromptKing"
        description="Find answers to common questions about using PromptKing, accessing premium prompts, and unlocking AI potential."
        schema={faqSchema}
      />
      <motion.div 
        className="main-content-area"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <header style={{ textAlign: 'center', marginBottom: '60px', position: 'relative' }}>
          {/* Subtle glow behind header */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '100px', background: 'var(--accent-glow)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
          
          <motion.div 
            variants={itemVariants}
            style={{ 
              display: 'inline-flex', padding: '16px', borderRadius: '24px', 
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
              color: 'var(--accent-main)', marginBottom: '25px', position: 'relative', zIndex: 1
            }}>
            <MessageSquare size={36} />
          </motion.div>
          <motion.h1 variants={itemVariants} style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-1.5px', fontFamily: 'var(--font-heading)', position: 'relative', zIndex: 1, textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            Knowledge Base
          </motion.h1>
          <motion.p variants={itemVariants} style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px', position: 'relative', zIndex: 1, lineHeight: 1.6 }}>
            Everything you need to know about PromptKing. Can't find an answer? Our support team is always here to help.
          </motion.p>

          <motion.div variants={itemVariants} style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', zIndex: 1 }}>
            <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search for answers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '18px 20px 18px 55px', borderRadius: '20px', fontSize: '1.1rem' }}
            />
          </motion.div>
        </header>

        {categories.map(cat => (
          <motion.section variants={itemVariants} key={cat} style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', whiteSpace: 'nowrap' }}>
                {cat}
              </h2>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)', width: '100%' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredFaqs.filter(f => (f.category || 'General') === cat).map(faq => {
                const isOpen = openIds.has(faq.id);
                return (
                  <motion.div 
                    layout
                    key={faq.id} 
                    className="glass-panel"
                    style={{ 
                      borderRadius: '24px', 
                      overflow: 'hidden',
                      background: isOpen ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: isOpen ? '0 20px 40px rgba(0,0,0,0.2)' : 'none',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                  >
                    <div 
                      onClick={() => toggleAccordion(faq.id)}
                      style={{ 
                        padding: '30px', cursor: 'pointer', display: 'flex', 
                        justifyContent: 'space-between', alignItems: 'center',
                        gap: '20px'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: isOpen ? 'white' : 'var(--text-main)', lineHeight: 1.4 }}>
                        {faq.question}
                      </span>
                      <motion.div 
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', 
                          background: isOpen ? 'var(--accent-main)' : 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, color: isOpen ? 'white' : 'var(--text-dim)'
                        }}
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    </div>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ 
                            padding: '0 30px 30px 30px', color: 'var(--text-secondary)', 
                            lineHeight: 1.8, fontSize: '1.05rem', 
                          }}>
                            {/* Inner styling to look like a premium text block */}
                            <div style={{ paddingLeft: '20px', borderLeft: '3px solid var(--accent-main)' }}>
                              {faq.answer}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        ))}
        
        {filteredFaqs.length === 0 && (
          <motion.div variants={itemVariants} style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <HelpCircle size={48} style={{ opacity: 0.2, margin: '0 auto 20px', color: 'white' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>No Results Found</h3>
            <p style={{ color: 'var(--text-dim)' }}>Try adjusting your search terms.</p>
          </motion.div>
        )}
      </motion.div>
      <SocialSidebar />
    </div>
  );
};

export default FAQPage;
