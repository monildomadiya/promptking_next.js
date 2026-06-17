import React from 'react';
import db from '@/lib/db';
import ClientArticleDetail from './ClientArticleDetail';

export async function generateMetadata({ params }) {
  const { slug } = params;
  let blogData = null;

  try {
    const rows = await db`SELECT * FROM blogs WHERE slug = ${slug}`;
    if (rows && rows.length > 0) {
      blogData = rows[0];
    }
  } catch (err) {
    console.error('Failed to fetch blog metadata:', err);
  }

  if (!blogData) {
    return { title: 'Article Not Found - PromptKing' };
  }

  const title = blogData.meta_title || blogData.title || 'AI Article - PromptKing';
  const description = blogData.meta_description || blogData.short_description || 'Read this AI engineering article on PromptKing.';
  const image = blogData.image || 'https://promptking.in/og-image.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      url: `https://promptking.in/article/${slug}`,
      type: 'article',
      publishedTime: blogData.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    }
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = params;
  let blog = null;
  let otherBlogs = [];
  let categories = [];

  try {
    const rows = await db`SELECT * FROM blogs WHERE slug = ${slug}`;
    if (rows && rows.length > 0) {
      blog = rows[0];
    }

    if (blog) {
      const others = await db`SELECT * FROM blogs WHERE slug != ${slug} ORDER BY created_at DESC LIMIT 3`;
      otherBlogs = others;
    }

    const catRows = await db`SELECT * FROM categories ORDER BY name ASC`;
    categories = catRows;
  } catch (err) {
    console.error('Failed to fetch blog data:', err);
  }

  const jsonLd = blog ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.meta_title || blog.title,
    description: blog.meta_description || blog.short_description,
    image: blog.image,
    datePublished: blog.created_at,
    dateModified: blog.created_at,
    author: {
      '@type': 'Organization',
      name: 'PromptKing'
    },
    publisher: {
      '@type': 'Organization',
      name: 'PromptKing',
      logo: {
        '@type': 'ImageObject',
        url: 'https://promptking.in/promptking-logo.svg'
      }
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ClientArticleDetail 
        initialBlog={blog} 
        initialOtherBlogs={otherBlogs} 
        initialCategories={categories} 
      />
    </>
  );
}
