import db from '@/lib/db';

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  try {
    const rows = await db`SELECT * FROM categories WHERE slug = ${slug}`;

    if (rows.length === 0) {
      return {
        title: 'Category Not Found - PromptKing',
      };
    }

    const category = rows[0];
    const title = category.meta_title || `${category.name} Prompts - PromptKing`;
    
    let plainDesc = '';
    if (category.description) {
      plainDesc = category.description.replace(/<[^>]*>?/gm, '').substring(0, 160);
    }
    const description = category.meta_description || category.meta_desc || plainDesc || `Explore the best AI prompts in the ${category.name} category.`;

    let image = category.image_url || 'https://promptking.in/og-image.jpg';
    if (image.startsWith('/')) image = `https://promptking.in${image}`;
    else if (!image.startsWith('http')) image = `https://promptking.in/${image}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://promptking.in/category/${slug}`,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      }
    };
  } catch (error) {
    console.error('Error generating metadata for category:', error);
    return {
      title: 'PromptKing - Categories',
    };
  }
}

export default function CategoryLayout({ children }) {
  return children;
}
