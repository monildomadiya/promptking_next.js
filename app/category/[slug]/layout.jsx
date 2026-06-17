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
    const description = category.meta_desc || `Explore the best AI prompts in the ${category.name} category.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://promptking.in/category/${slug}`,
      },
      twitter: {
        card: 'summary',
        title,
        description,
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
