import React, { cache } from 'react';
import db from '@/lib/db';
import { resolveCanonical, seoTitle, seoDescription, cleanSchema } from '@/lib/seo';
import ClientArticleDetail from './ClientArticleDetail';

/**
 * generateMetadata and the page component both need the full row, and Next.js
 * calls them separately — so this ran as two identical full-table-scan queries
 * per article request. React's cache() dedupes them within a single render.
 */
const getBlogBySlug = cache(async (slug) => {
  const rows = await db`SELECT * FROM blogs WHERE slug = ${slug}`;
  return rows && rows.length > 0 ? rows[0] : null;
});

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  let blogData = null;

  try {
    blogData = await getBlogBySlug(slug);
  } catch (err) {
    console.error('Failed to fetch blog metadata:', err);
  }

  if (!blogData) {
    return { title: 'Article Not Found - PromptKing' };
  }

  const title = seoTitle(blogData.meta_title || blogData.title || 'AI Article - PromptKing');
  let plainDesc = '';
  if (blogData.content) {
    plainDesc = blogData.content.replace(/<[^>]*>?/gm, '');
  }
  const description = seoDescription(
    blogData.meta_description || blogData.excerpt || plainDesc || `Read "${blogData.title || 'article'}" on PromptKing Blog.`
  );
  let image = blogData.og_image || blogData.featured_image || 'https://promptking.in/og-image.jpg';
  if (image.startsWith('/')) image = `https://promptking.in${image}`;
  else if (!image.startsWith('http')) image = `https://promptking.in/${image}`;
  const canonicalUrl = resolveCanonical(blogData.canonical_url, `/article/${slug}`);

  let tagsArray = [];
  try {
    tagsArray = blogData.tags ? (typeof blogData.tags === 'string' ? JSON.parse(blogData.tags) : blogData.tags) : [];
  } catch (e) {}
  
  const keywordsStr = tagsArray.length > 0 ? tagsArray.join(', ') : 'AI, Prompts, PromptKing, ChatGPT, Midjourney';

  return {
    title,
    description,
    keywords: keywordsStr,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: blogData.og_title || title,
      description: blogData.og_description || description,
      url: canonicalUrl,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      type: 'article',
      publishedTime: blogData.published_at || blogData.created_at,
      modifiedTime: blogData.updated_at || blogData.created_at,
      authors: [blogData.author_name || 'PromptKing'],
    },
    twitter: {
      card: 'summary_large_image',
      title: blogData.twitter_title || blogData.og_title || title,
      description: blogData.twitter_description || blogData.og_description || description,
      images: [blogData.twitter_image || image],
    }
  };
}

export default async function ArticlePage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  let blog = null;
  let otherBlogs = [];
  let categories = [];

  try {
    const b = await getBlogBySlug(slug);
    if (b) {
      let selectedAuthor = null;
      if (b.author_id) {
        const specificAuthor = await db`SELECT * FROM authors WHERE id = ${b.author_id}`;
        if (specificAuthor.length > 0) selectedAuthor = specificAuthor[0];
      }
      
      if (!selectedAuthor) {
        const authors = await db`SELECT * FROM authors ORDER BY id ASC LIMIT 1`;
        selectedAuthor = authors.length > 0 ? authors[0] : null;
      }

      blog = {
        ...b,
        author_name: selectedAuthor?.name || 'PromptKing Admin',
        author_image: selectedAuthor?.image || 'https://promptking.in/favicon.png',
        author_description: selectedAuthor?.description || 'Passionate about AI and creative workflows. Exploring the frontiers of prompt engineering to help you unlock the true potential of tools like ChatGPT, Midjourney, and Gemini.'
      };
    }

    if (blog) {
      // The "More Articles" sidebar renders a thumbnail, title and date. SELECT *
      // put three full article bodies into this page's RSC payload for nothing.
      otherBlogs = await db`
        SELECT id, title, slug, featured_image, featured_image_alt, read_time, published_at, created_at
        FROM blogs WHERE slug != ${slug} ORDER BY created_at DESC LIMIT 3
      `;
    }

    // website_categories is what /category/[slug] resolves against. The legacy
    // `categories` table produced "Related Prompts" links to 404 pages.
    const catRows = await db`SELECT * FROM website_categories ORDER BY name ASC`;
    categories = catRows;
  } catch (err) {
    console.error('Failed to fetch blog data:', err);
  }

  const canonicalUrl = blog ? resolveCanonical(blog.canonical_url, `/article/${slug}`) : '';

  const jsonLd = blog ? cleanSchema({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    headline: blog.meta_title || blog.title,
    description: blog.meta_description || blog.excerpt || blog.short_description,
    image: blog.og_image || blog.featured_image || 'https://promptking.in/og-image.png',
    datePublished: blog.published_at || blog.created_at,
    dateModified: blog.updated_at || blog.created_at,
    author: {
      '@type': 'Person',
      name: blog.author_name || 'PromptKing',
      url: 'https://promptking.in/about'
    },
    publisher: {
      '@type': 'Organization',
      name: 'PromptKing',
      logo: {
        '@type': 'ImageObject',
        url: 'https://promptking.in/promptking-logo.svg'
      }
    }
  }) : null;

  let faqs = [];
  try { faqs = blog && blog.faqs ? (typeof blog.faqs === 'string' ? JSON.parse(blog.faqs) : blog.faqs) : []; } catch(e) {}
  
  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null;

  const breadcrumbJsonLd = blog ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://promptking.in/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://promptking.in/blog' },
      { '@type': 'ListItem', position: 3, name: blog.title, item: canonicalUrl }
    ]
  } : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      )}
      <ClientArticleDetail 
        initialBlog={blog} 
        initialOtherBlogs={otherBlogs} 
        initialCategories={categories} 
      />
    </>
  );
}
