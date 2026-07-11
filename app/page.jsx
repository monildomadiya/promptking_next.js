import ClientHomePage from './ClientHomePage';
import { fetchAllData } from '@/lib/data';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/cache';

// ISR: page is cached for 60 seconds, then regenerated on next request
export const revalidate = 60;

async function fetchWebsiteCategories() {
  const CACHE_KEY = 'website_categories_ssr';
  const cached = cacheGet(CACHE_KEY);
  if (cached) return cached;

  try {
    const rows = await db`SELECT id, name, slug, image_url, tag FROM website_categories ORDER BY created_at DESC`;
    cacheSet(CACHE_KEY, rows, 10 * 60 * 1000); // 10 minutes
    return rows;
  } catch {
    return [];
  }
}

export default async function Page() {
  // Fetch all data in parallel for fastest load
  const [{ prompts, categories }, websiteCategories] = await Promise.all([
    fetchAllData(),
    fetchWebsiteCategories(),
  ]);
  
  return (
    <>
      {/*
        SEO-critical content rendered server-side.
        Visually hidden but present in HTML for crawlers with JS rendering disabled.
        Also provides internal links to all prompt pages (fixes Semrush 'only 1 incoming link' warning).
      */}
      <div
        aria-hidden="false"
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
        <h2>PromptKing - Free &amp; Premium AI Prompts Library</h2>
        <p>
          Discover over 1000 free and premium AI prompts for ChatGPT, Midjourney, Claude, Gemini,
          and other leading AI tools. PromptKing is the ultimate AI prompts library for creators,
          developers, artists, writers, and businesses. Browse our extensive collection of carefully
          crafted prompts across categories including portrait photography, landscape art, business
          writing, creative fiction, code generation, marketing copy, social media content, and much more.
          Each prompt is tested and optimized by our team of expert prompt engineers to ensure the
          highest quality AI output. Copy any prompt instantly with one click and use it in your
          favorite AI tool. Whether you need prompts for image generation with Midjourney and DALL-E,
          text generation with ChatGPT and Claude, or creative workflows with Gemini, PromptKing has
          you covered. Start exploring our free prompts today and upgrade to premium for exclusive
          high-performance prompts that deliver stunning, consistent results every time.
        </p>
        {/* Internal links to all prompt pages — helps crawlers discover and internally link to prompt pages */}
        {prompts && prompts.length > 0 && (
          <nav aria-label="Featured AI Prompts">
            <p>Browse our featured AI prompts:</p>
            <ul>
              {prompts.map((prompt) => (
                <li key={prompt.slug || prompt.prompt_key}>
                  <a href={`/prompt/${prompt.slug || prompt.prompt_key}`}>
                    {prompt.title || prompt.prompt_key}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {/* Internal links to category pages */}
        {categories && categories.length > 0 && (
          <nav aria-label="Prompt Categories">
            <p>Browse prompts by category:</p>
            <ul>
              {categories.map((cat) => (
                <li key={cat.slug || cat.id}>
                  <a href={`/category/${cat.slug}`}>{cat.name}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      <ClientHomePage 
        initialPrompts={prompts} 
        initialCategories={categories}
        initialWebsiteCategories={websiteCategories}
      />
    </>
  );
}
