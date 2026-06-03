import PromptList from '../components/Prompts/PromptList';
import SEOMetadata from '../components/SEO/SEOMetadata';

const HomePage = ({ search, filter, setFilter, isMobile }) => {
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
        title="PromptKing - The Ultimate AI Prompts Library for ChatGPT, Midjourney & Gemini"
        description="Discover the world's best AI prompt library. Get premium & free prompts for ChatGPT, Midjourney, Gemini, DALL-E and more. Unlock professional-grade AI results instantly."
        url="https://promptking.in/"
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
        PromptKing - Premium AI Prompts Library for ChatGPT, Midjourney & Gemini
      </h1>
      <PromptList 
        search={search} 
        filter={filter} 
        setFilter={setFilter} 
        isMobile={isMobile}
      />
    </main>
  );
};

export default HomePage;
