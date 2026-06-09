import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'PromptKing';
const SITE_URL = 'https://promptking.in';
const DEFAULT_IMAGE = 'https://promptking.in/og-image.png';
const DEFAULT_KEYWORDS = 'ai prompts, chatgpt prompts, midjourney prompts, gemini prompts, prompt engineering, ai art prompts, premium prompts, best chatgpt prompts, ai prompt library';

const SEOMetadata = ({ 
  title = 'PromptKing - The Ultimate AI Prompts Library', 
  description = 'Discover the ultimate library of premium AI prompts for ChatGPT, Midjourney, Gemini, and more. Elevate your workflows, get more done, unlock world-class AI results.',
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url = typeof window !== 'undefined' ? window.location.href : SITE_URL,
  canonicalUrlOverride = null,
  schema = null, // Can be object or array of objects
  noIndex = false,
  type = 'website',
  publishedDate = null,
  modifiedDate = null,
  breadcrumb = null, // Array of { name, url } objects
  
  // Custom Overrides
  ogTitle,
  ogDescription,
  ogImage,
  twitterTitle,
  twitterDescription,
  twitterImage
}) => {
  const canonicalUrl = canonicalUrlOverride || url.split('?')[0];

  const breadcrumbSchema = breadcrumb && breadcrumb.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumb.map((item, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': item.name,
      'item': item.url,
    })),
  } : null;

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': SITE_NAME,
    'url': SITE_URL,
    'logo': DEFAULT_IMAGE,
    'sameAs': [
      'https://www.instagram.com/promptking.in',
      'https://www.youtube.com/@promptking',
    ],
  };

  const schemas = Array.isArray(schema) ? schema : (schema ? [schema] : []);

  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />}
      <meta name="author" content="PromptKing" />

      {/* ── OpenGraph ────────────────────────────────────────── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage || image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogTitle || title} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_US" />
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}

      {/* ── Twitter / X Card ─────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@promptking_in" />
      <meta name="twitter:creator" content="@promptking_in" />
      <meta name="twitter:title" content={twitterTitle || ogTitle || title} />
      <meta name="twitter:description" content={twitterDescription || ogDescription || description} />
      <meta name="twitter:image" content={twitterImage || ogImage || image} />
      <meta name="twitter:image:alt" content={twitterTitle || ogTitle || title} />

      {/* ── JSON-LD Schemas ───────────────────────────────────── */}
      <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>

      {schemas.map((sch, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(sch)}</script>
      ))}

      {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
    </Helmet>
  );
};

export default SEOMetadata;
