import { notFound } from 'next/navigation';
import ClientDeals from './ClientDeals';
import { fetchAffiliateProducts, getAffiliateSettings } from '@/lib/affiliate';
import { SITE_URL } from '@/lib/seo';

// Admin saves call publishChanges and drop the data cache immediately; this
// only bounds how late a deal's end date takes it off the page.
export const revalidate = 60;

export async function generateMetadata() {
  const settings = await getAffiliateSettings();
  const title = `${settings.affiliate_page_title} | PromptKing`;
  const description = settings.affiliate_page_subtitle;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/deals` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/deals`,
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'PromptKing Deals' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${SITE_URL}/og-image.jpg`] },
  };
}

export default async function DealsPage() {
  const settings = await getAffiliateSettings();
  // Switched off in the admin means the page does not exist, rather than an
  // empty shop window Google could index.
  if (settings.affiliate_enabled !== '1') notFound();

  const products = await fetchAffiliateProducts();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: settings.affiliate_page_title,
    description: settings.affiliate_page_subtitle,
    url: `${SITE_URL}/deals`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 24).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        ...(p.image ? { image: p.image } : {}),
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ClientDeals
        products={products}
        title={settings.affiliate_page_title}
        subtitle={settings.affiliate_page_subtitle}
        disclosure={settings.affiliate_disclosure}
      />
    </>
  );
}
