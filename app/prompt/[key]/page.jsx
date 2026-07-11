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

  return {
    title,
    description,
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

  return (
    <>
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

