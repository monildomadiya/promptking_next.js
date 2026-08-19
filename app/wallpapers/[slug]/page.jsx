import { notFound } from 'next/navigation';
import ClientWallpaperDetail from './ClientWallpaperDetail';
import { fetchWallpapers, fetchWallpaperBySlug } from '@/lib/wallpapers';
import { SITE_URL, seoTitle, seoDescription } from '@/lib/seo';

export const revalidate = 60;

export async function generateStaticParams() {
  const wallpapers = await fetchWallpapers();
  return wallpapers.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const wallpaper = await fetchWallpaperBySlug(slug);

  if (!wallpaper) {
    return { title: 'Wallpaper not found | PromptKing' };
  }

  const title = seoTitle(wallpaper.metaTitle || `${wallpaper.title} - Free AI Wallpaper`);
  const description = seoDescription(
    wallpaper.metaDescription ||
      wallpaper.description ||
      `Download ${wallpaper.title} free in phone and desktop resolution. AI-generated wallpaper, no sign-up and no watermark.`
  );

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/wallpapers/${wallpaper.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/wallpapers/${wallpaper.slug}`,
      type: 'article',
      images: [{ url: wallpaper.image, alt: wallpaper.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [wallpaper.image] },
  };
}

export default async function WallpaperDetailPage({ params }) {
  const { slug } = await params;
  const wallpaper = await fetchWallpaperBySlug(slug);

  if (!wallpaper) notFound();

  const all = await fetchWallpapers();
  const more = all.filter((w) => w.slug !== wallpaper.slug).slice(0, 8);

  // ImageObject rather than Product: these are free downloads, and Product
  // without an offer is the kind of markup that earns a manual action.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: wallpaper.title,
    description: wallpaper.description || `Free AI-generated wallpaper: ${wallpaper.title}`,
    contentUrl: wallpaper.image,
    url: `${SITE_URL}/wallpapers/${wallpaper.slug}`,
    ...(wallpaper.width ? { width: wallpaper.width } : {}),
    ...(wallpaper.height ? { height: wallpaper.height } : {}),
    ...(wallpaper.createdAt ? { uploadDate: wallpaper.createdAt } : {}),
    creditText: 'PromptKing',
    license: `${SITE_URL}/terms`,
    acquireLicensePage: `${SITE_URL}/wallpapers/${wallpaper.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ClientWallpaperDetail wallpaper={wallpaper} more={more} />
    </>
  );
}
