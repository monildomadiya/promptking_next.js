import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'PromptKing';
const SITE_URL = 'https://promptking.in';
const DEFAULT_IMAGE = 'https://promptking.in/favicon.png';
const DEFAULT_KEYWORDS = 'ai prompts, chatgpt prompts, midjourney prompts, gemini prompts, prompt engineering, ai art prompts, premium prompts, best chatgpt prompts, ai prompt library';

const SEOMetadata = ({ 
  title = 'PromptKing - The Ultimate AI Prompts Library', 
  description = 'Discover the ultimate library of premium AI prompts for ChatGPT, Midjourney, Gemini, and more. Elevate your workflows, get more done, unlock world-class AI results.',
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url = typeof window !== 'undefined' ? window.location.href : SITE_URL,
  schema = null,
  noIndex = false,
  type = 'website',
  publishedDate = null,
  modifiedDate = null,
  breadcrumb = null, // Array of { name, url } objects
}) => {
  const canonicalUrl = url.split('?')[0]; // Strip query params for canonical

  // Build BreadcrumbList schema from breadcrumb prop
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

  // Organization schema – always present for brand authority
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

  return (
    <Helmet>
      {/* ── Core ─────────────────────────────────────────────── */}
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />}
      <meta name="author" content="PromptKing" />

      {/* ── OpenGraph ────────────────────────────────────────── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_US" />
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}

      {/* ── Twitter / X Card ─────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@promptking_in" />
      <meta name="twitter:creator" content="@promptking_in" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />

      {/* ── JSON-LD Schemas ───────────────────────────────────── */}
      {/* Organization always present */}
      <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>

      {/* Page-level schema (WebSite, Article, etc.) */}
      {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}

      {/* Breadcrumb schema when provided */}
      {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
    </Helmet>
  );
};

export default SEOMetadata;
