import db from '@/lib/db';

export async function generateMetadata({ params }) {
  // Access params safely
  const resolvedParams = await Promise.resolve(params);
  const key = decodeURIComponent(resolvedParams.key);

  try {
    const rows = await db`
      SELECT * FROM prompts 
      WHERE prompt_key = ${key} OR (slug = ${key} AND slug IS NOT NULL AND slug != '')
    `;

    if (rows.length === 0) {
      return {
        title: 'Prompt Not Found - PromptKing',
      };
    }

    const prompt = rows[0];
    const title = prompt.meta_title || `${prompt.prompt_text?.substring(0, 50)}... - PromptKing`;
    const description = prompt.prompt_text?.substring(0, 160) || 'Discover amazing AI prompts on PromptKing.';
    const images = [];

    // Attempt to parse gallery URLs for OG image
    if (prompt.gallery_urls) {
      try {
        const parsed = JSON.parse(prompt.gallery_urls);
        if (parsed.length > 0) {
          images.push(parsed[0]);
        }
      } catch (e) {
        // Fallback or ignore if not JSON
        if (typeof prompt.gallery_urls === 'string' && prompt.gallery_urls.startsWith('http')) {
           images.push(prompt.gallery_urls);
        }
      }
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://promptking.in/prompt/${key}`,
        images: images.length > 0 ? images : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: images.length > 0 ? images : undefined,
      }
    };
  } catch (error) {
    console.error('Error generating metadata for prompt:', error);
    return {
      title: 'PromptKing - Free AI Prompts',
    };
  }
}

export default function PromptLayout({ children }) {
  return children;
}
