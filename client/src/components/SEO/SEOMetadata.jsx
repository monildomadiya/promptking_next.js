import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOMetadata = ({ 
  title = "PromptKing - Premium AI Prompts", 
  description = "Discover the ultimate library of premium AI prompts for ChatGPT, Midjourney, and more. Elevate your workflows to professional levels.", 
  keywords = "ai prompts, chatgpt prompts, midjourney prompts, gemini prompts, prompt engineering, ai art prompts, premium prompts",
  image = "https://promptking.in/banner.jpg", 
  url = window.location.href,
  schema = null
}) => {
  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="canonical" href={url} />

      {/* OpenGraph / Social Metadata */}
      <meta property="og:site_name" content="PromptKing" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      {/* Twitter Metadata */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@promptking" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schema (Structured Data) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOMetadata;
