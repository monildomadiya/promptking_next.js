"use client";
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

import PromptList from '@/components/Prompts/PromptList';
import CategorySlider from '@/components/Prompts/CategorySlider';
import SEOMetadata from '@/components/SEO/SEOMetadata';

import { useAppContext } from '@/components/AppContext';

const HomePage = ({ initialPrompts = [], initialCategories = [], initialWebsiteCategories = [] }) => {
  const { search, filter, setFilter, isMobile } = useAppContext();
  const { categorySlug } = useParams();

  // Sync URL parameter with filter state on mount or when URL changes
  useEffect(() => {
    if (categorySlug) {
      setFilter(categorySlug.toLowerCase());
    } else if (!categorySlug && filter !== 'premium' && filter !== 'free' && filter !== 'all' && !search) {
       if(filter !== 'all') {
         setFilter('all');
       }
    }
  }, [categorySlug, setFilter]); // removed 'filter' to avoid infinite loops when clicking quick filters

  const getPageTitle = () => {
    if (categorySlug) {
      const formattedCategory = categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return `${formattedCategory} Prompts - Free AI Library | PromptKing`;
    }
    return "PromptKing – Free AI Prompts for ChatGPT, Gemini, Midjourney & More";
  };

  const getPageDescription = () => {
    if (categorySlug) {
      const formattedCategory = categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return `Explore our curated collection of high-quality ${formattedCategory} prompts. Copy and use these free AI prompts instantly to improve your workflow.`;
    }
    return "Discover 1000+ free AI prompts for ChatGPT, Gemini, Midjourney, DALL·E & Stable Diffusion. Copy expert-crafted prompts for image creation, writing & more. Updated daily.";
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PromptKing",
    "url": "https://promptking.in/",
    "description": "Unlock the full potential of AI with PromptKing. Discover premium & free prompts for ChatGPT, Midjourney, Gemini and more.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://promptking.in/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <main>
      <SEOMetadata 
        title={getPageTitle()}
        description={getPageDescription()}
        url={`https://promptking.in${categorySlug ? `/category/${categorySlug}` : '/'}`}
        schema={schema}
      />
      <h1 style={{ 
        position: 'absolute', 
        width: '1px', 
        height: '1px', 
        padding: 0, 
        margin: '-1px', 
        overflow: 'hidden', 
        clip: 'rect(0,0,0,0)', 
        border: 0 
      }}>
        {categorySlug ? `${categorySlug.split('-').join(' ')} AI Prompts Library` : 'PromptKing - Premium AI Prompts Library for ChatGPT, Midjourney & Gemini'}
      </h1>
      {/* Pass server-fetched website categories so CategorySlider skips its own network request */}
      <CategorySlider initialCategories={initialWebsiteCategories} />
      <PromptList 
        search={search} 
        filter={filter} 
        setFilter={setFilter} 
        isMobile={isMobile}
        initialPrompts={initialPrompts}
        initialCategories={initialCategories}
      />
    </main>
  );
};

export default HomePage;
