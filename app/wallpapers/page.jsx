import ClientWallpapers from './ClientWallpapers';
import { fetchWallpapers, fetchWallpaperCategories } from '@/lib/wallpapers';
import { SITE_URL } from '@/lib/seo';

// Same cadence as the prompt grid — admin saves call publishChanges and drop
// the data cache immediately, so this only bounds changes made in the database.
export const revalidate = 60;

const TITLE = 'Free AI Wallpapers - Phone & Desktop Downloads | PromptKing';
const DESCRIPTION =
  'Download free AI-generated wallpapers for phone and desktop. High-resolution, no sign-up, no watermark — one tap and the file is yours.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/wallpapers` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/wallpapers`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'PromptKing Wallpapers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default async function WallpapersPage() {
  const [wallpapers, categories] = await Promise.all([
    fetchWallpapers(),
    fetchWallpaperCategories(),
  ]);

  // A CollectionPage listing the items Google can already see in the markup.
  // Kept to the first 24 so a growing library doesn't turn every page render
  // into a several-hundred-entry JSON-LD blob.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Wallpapers',
    description: DESCRIPTION,
    url: `${SITE_URL}/wallpapers`,
    hasPart: wallpapers.slice(0, 24).map((w) => ({
      '@type': 'ImageObject',
      name: w.title,
      contentUrl: w.image,
      url: `${SITE_URL}/wallpapers/${w.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ClientWallpapers wallpapers={wallpapers} categories={categories} />
    </>
  );
}
