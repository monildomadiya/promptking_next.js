import db from '@/lib/db';

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  try {
    const rows = await db`SELECT * FROM blogs WHERE slug = ${slug}`;

    if (rows.length === 0) {
      return {
        title: 'Article Not Found - PromptKing',
      };
    }

    const blog = rows[0];
    const title = blog.title || 'Article - PromptKing';
    const description = blog.meta_desc || blog.content?.replace(/<[^>]*>?/gm, '').substring(0, 160) || 'Read this amazing article on PromptKing.';
    
    // Parse cover image URL if stored as JSON array, otherwise use string
    let imageUrl;
    if (blog.cover_image) {
      try {
        const parsed = JSON.parse(blog.cover_image);
        if (parsed.length > 0) {
          imageUrl = parsed[0];
        }
      } catch (e) {
        if (typeof blog.cover_image === 'string' && blog.cover_image.startsWith('http')) {
          imageUrl = blog.cover_image;
        }
      }
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://promptking.in/article/${slug}`,
        images: imageUrl ? [imageUrl] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      }
    };
  } catch (error) {
    console.error('Error generating metadata for article:', error);
    return {
      title: 'PromptKing - Articles',
    };
  }
}

export default function ArticleLayout({ children }) {
  return children;
}
