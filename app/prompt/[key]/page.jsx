import Link from 'next/link';
import db from '@/lib/db';
import ClientPromptDetail from './ClientPromptDetail';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const key = decodeURIComponent(resolvedParams.key);

  let promptData = null;
  try {
    const promptRows = await db`
      SELECT * FROM prompts 
      WHERE prompt_key = ${key} OR (slug = ${key} AND slug IS NOT NULL AND slug != '')
    `;
    if (promptRows.length > 0) promptData = promptRows[0];
  } catch (err) {}

  if (!promptData) {
    return { title: 'Prompt Not Found - PromptKing' };
  }

  const title = promptData.meta_title || `${promptData.title || 'AI Prompt'} - PromptKing`;
  let plainDesc = '';
  if (promptData.description) {
    plainDesc = promptData.description.replace(/<[^>]*>?/gm, '').substring(0, 160);
  }
  const description = promptData.meta_description || plainDesc || `Unlock the "${promptData.title || 'AI'}" AI prompt on PromptKing. Works with ${promptData.ai_type || 'AI'}.`;
  let image = promptData.thumbnail_url || promptData.img_after || 'https://promptking.in/og-image.jpg';
  if (image.startsWith('/')) image = `https://promptking.in${image}`;
  else if (!image.startsWith('http')) image = `https://promptking.in/${image}`;
  const canonicalUrl = `https://promptking.in/prompt/${promptData.slug || promptData.prompt_key}`;

  // Build per-prompt keywords from the title, AI tool and tags, plus evergreen
  // high-intent terms — helps long-tail SEO and gives contextual ad targeting
  // stronger, more commercial signals.
  let tagKeywords = [];
  try {
    if (promptData.tags) {
      tagKeywords = typeof promptData.tags === 'string'
        ? (promptData.tags.trim().startsWith('[') ? JSON.parse(promptData.tags) : promptData.tags.split(',').map(t => t.trim()))
        : (Array.isArray(promptData.tags) ? promptData.tags : []);
    }
  } catch (e) {}
  const aiTool = promptData.ai_type || 'AI';
  const keywords = [
    ...(promptData.title ? [promptData.title, `${promptData.title} prompt`] : []),
    `${aiTool} prompt`, `${aiTool} prompts`,
    ...tagKeywords,
    'AI prompt', 'AI image generator', 'prompt engineering',
    'ChatGPT prompts', 'Midjourney prompts', 'free AI prompts', 'PromptKing',
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
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
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    }
  };
}

export default async function PromptPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const key = decodeURIComponent(resolvedParams.key);

  let initialPrompt = null;
  let initialSuggestedPrompts = [];
  let adsSettings = {};
  let promptCategory = null;

  try {
    const promptRows = await db`
      SELECT * FROM prompts 
      WHERE prompt_key = ${key} OR (slug = ${key} AND slug IS NOT NULL AND slug != '')
    `;

    if (promptRows.length === 0) {
      notFound();
    }

    // Check session to allow admins to preview drafts
    let session = null;
    try {
      session = await getSession();
    } catch (err) {
      // ignore
    }

    // Block public access to draft prompts removed

    if (promptRows.length > 0) {
      const p = promptRows[0];
      
      let selectedAuthor = null;
      if (p.author_id) {
        const specificAuthor = await db`SELECT * FROM authors WHERE id = ${p.author_id}`;
        if (specificAuthor.length > 0) selectedAuthor = specificAuthor[0];
      }
      
      if (!selectedAuthor) {
        const authors = await db`SELECT * FROM authors ORDER BY id ASC LIMIT 1`;
        selectedAuthor = authors.length > 0 ? authors[0] : null;
      }

      initialPrompt = {
        ...p,
        author_name: selectedAuthor?.name || 'PromptKing Admin',
        author_image: selectedAuthor?.image || 'https://promptking.in/favicon.png',
        author_description: selectedAuthor?.description || 'Passionate about AI and creative workflows. Exploring the frontiers of prompt engineering to help you unlock the true potential of tools like ChatGPT, Midjourney, and Gemini.',
        promptText: p.prompt_text || p.promptText,
        thumbnail_url: p.thumbnail_url,
        imgAfter: p.thumbnail_url || p.img_after || p.imgAfter,
        imgBefore: p.img_before || p.imgBefore,
        isPremium: p.is_premium || p.isPremium,
        aiType: p.ai_type || p.aiType,
        imageRatio: p.image_ratio || p.imageRatio,
        isImageSlider: p.is_image_slider || p.isImageSlider,
        igLink: p.ig_link || p.igLink,
        metaTitle: p.meta_title || p.metaTitle,
        copyCount: p.copy_count || p.copy_count,
        viewCount: p.view_count || p.view_count
      };

      if (p.website_category_id) {
        try {
          const catRows = await db`SELECT slug, name FROM website_categories WHERE id = ${p.website_category_id}`;
          if (catRows.length > 0) promptCategory = catRows[0];
        } catch (e) {}
        const suggestRows = await db`
          SELECT * FROM prompts
          WHERE website_category_id = ${p.website_category_id} AND prompt_key != ${p.prompt_key}
          ORDER BY prompt_key DESC LIMIT 20
        `;
        initialSuggestedPrompts = suggestRows.sort(() => 0.5 - Math.random()).slice(0, 4);
      } else if (p.category_id) {
        const suggestRows = await db`
          SELECT * FROM prompts 
          WHERE category_id = ${p.category_id} AND prompt_key != ${p.prompt_key} 
          ORDER BY prompt_key DESC LIMIT 20
        `;
        initialSuggestedPrompts = suggestRows.sort(() => 0.5 - Math.random()).slice(0, 4);
      }
    }

    try {
      const settingsRows = await db`SELECT * FROM settings WHERE \`key\` = 'ads'`;
      if (settingsRows.length > 0) {
        try {
          adsSettings = JSON.parse(settingsRows[0].value);
        } catch (e) {}
      }
    } catch (e) {
      // Ignore if settings table doesn't exist
    }

  } catch (error) {
    console.error("Error fetching prompt detail server-side:", error);
  }

  // Parse tags for SSR
  let parsedTags = [];
  try {
    if (initialPrompt?.tags) {
      parsedTags = typeof initialPrompt.tags === 'string'
        ? (initialPrompt.tags.trim().startsWith('[') ? JSON.parse(initialPrompt.tags) : initialPrompt.tags.split(',').map(t => t.trim()).filter(Boolean))
        : (Array.isArray(initialPrompt.tags) ? initialPrompt.tags : []);
    }
  } catch (e) {}

  // Parse FAQs for SSR
  let parsedFaqs = [];
  try {
    if (initialPrompt?.faqs) {
      parsedFaqs = typeof initialPrompt.faqs === 'string' ? JSON.parse(initialPrompt.faqs) : (initialPrompt.faqs || []);
    }
  } catch (e) {}

  // ── Structured data (JSON-LD) ──────────────────────────────────────
  // Rendered server-side so crawlers reliably receive it. The client-side
  // SEOMetadata component does not emit schema, so prompt pages previously
  // shipped none. Mirrors the article page. ldStringify prevents a prompt
  // body containing "</script>" from breaking out of the tag.
  const ldStringify = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
  const canonicalUrl = initialPrompt
    ? (initialPrompt.canonical_url || `https://promptking.in/prompt/${initialPrompt.slug || initialPrompt.prompt_key}`)
    : '';

  let promptImage = initialPrompt?.thumbnail_url || initialPrompt?.img_after || initialPrompt?.imgAfter || 'https://promptking.in/og-image.jpg';
  if (promptImage.startsWith('/')) promptImage = `https://promptking.in${promptImage}`;
  else if (!promptImage.startsWith('http')) promptImage = `https://promptking.in/${promptImage}`;

  const plainPromptDesc = initialPrompt
    ? (initialPrompt.meta_description
        || (initialPrompt.description ? initialPrompt.description.replace(/<[^>]*>?/gm, '').trim().substring(0, 200) : '')
        || initialPrompt.short_description
        || `A professionally engineered ${initialPrompt.ai_type || 'AI'} prompt from PromptKing.`)
    : '';

  const creativeWorkJsonLd = initialPrompt ? {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: initialPrompt.title,
    description: plainPromptDesc,
    image: promptImage,
    url: canonicalUrl,
    genre: initialPrompt.ai_type || 'AI Prompt',
    keywords: parsedTags.length ? parsedTags.join(', ') : `${initialPrompt.ai_type || 'AI'} prompt, prompt engineering, PromptKing`,
    inLanguage: 'en',
    isAccessibleForFree: !initialPrompt.isPremium,
    datePublished: initialPrompt.created_at || undefined,
    dateModified: initialPrompt.updated_at || initialPrompt.created_at || undefined,
    author: { '@type': 'Organization', name: 'PromptKing', url: 'https://promptking.in' },
    publisher: {
      '@type': 'Organization',
      name: 'PromptKing',
      url: 'https://promptking.in',
      logo: { '@type': 'ImageObject', url: 'https://promptking.in/promptking-logo.svg' },
    },
  } : null;

  const softwareSourceJsonLd = initialPrompt ? {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: initialPrompt.title,
    description: `An AI prompt engineered for ${initialPrompt.ai_type || 'Generative AI'}.`,
    programmingLanguage: 'Natural Language',
    codeSampleType: 'AI Prompt',
    text: initialPrompt.promptText || initialPrompt.prompt_text || initialPrompt.title,
    url: canonicalUrl,
    creator: { '@type': 'Organization', name: 'PromptKing' },
  } : null;

  const breadcrumbJsonLd = initialPrompt ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://promptking.in/' },
      ...(promptCategory
        ? [{ '@type': 'ListItem', position: 2, name: promptCategory.name, item: `https://promptking.in/category/${promptCategory.slug}` }]
        : []),
      { '@type': 'ListItem', position: promptCategory ? 3 : 2, name: initialPrompt.title, item: canonicalUrl },
    ],
  } : null;

  const faqJsonLd = parsedFaqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: parsedFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null;

  return (
    <>
      {creativeWorkJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldStringify(creativeWorkJsonLd) }} />
      )}
      {softwareSourceJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldStringify(softwareSourceJsonLd) }} />
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldStringify(breadcrumbJsonLd) }} />
      )}
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldStringify(faqJsonLd) }} />
      )}
      {/*
        Server-rendered prompt content — visible to Google AdSense & search crawlers
        without JavaScript. Fixes "low value content" rejection.
      */}
      {initialPrompt && (
        <article
          aria-label={`${initialPrompt.title} AI Prompt`}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          <h2>{initialPrompt.title}</h2>

          {initialPrompt.ai_type && (
            <p><strong>AI Tool:</strong> {initialPrompt.ai_type}</p>
          )}

          {initialPrompt.short_description && (
            <p>{initialPrompt.short_description}</p>
          )}

          {initialPrompt.description && (
            <div dangerouslySetInnerHTML={{ __html: initialPrompt.description }} />
          )}

          {parsedTags.length > 0 && (
            <section>
              <h2>Tags</h2>
              <ul>
                {parsedTags.map((tag, i) => <li key={i}>{tag}</li>)}
              </ul>
            </section>
          )}

          {parsedFaqs.length > 0 && (
            <section>
              <h2>Frequently Asked Questions</h2>
              <dl>
                {parsedFaqs.map((faq, i) => (
                  <div key={i}>
                    <dt><strong>{faq.question}</strong></dt>
                    <dd>{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section>
            <h2>About This Prompt</h2>
            <p>
              This is a professionally engineered AI prompt from the PromptKing library, 
              designed for use with {initialPrompt.ai_type || 'AI tools'} such as ChatGPT, 
              Midjourney, Google Gemini, and Claude. Copy this prompt instantly and use it 
              to generate high-quality AI output. PromptKing offers 1000+ free and premium 
              AI prompts across 50+ categories for creators, developers, and marketers.
            </p>
            <nav aria-label="Prompt breadcrumb">
              <ol>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/">Prompts</Link></li>
                <li>{initialPrompt.title}</li>
              </ol>
            </nav>
          </section>
        </article>
      )}

      <ClientPromptDetail 
        initialPrompt={initialPrompt} 
        initialSuggestedPrompts={initialSuggestedPrompts}
        adsSettings={adsSettings}
      />
    </>
  );
}

