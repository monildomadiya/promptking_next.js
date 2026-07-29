export const metadata = {
  title: "AdSense Policy - PromptKing | Ad Compliance Guidelines",
  description: "Read PromptKing's AdSense compliance policy detailing our adherence to Google AdSense terms, ad placement guidelines, and content standards.",
  alternates: {
    canonical: "https://promptking.in/adsense-policy",
  },
  openGraph: {
    title: "AdSense Policy - PromptKing | Ad Compliance Guidelines",
    description: "Read PromptKing's AdSense compliance policy detailing our adherence to Google AdSense terms and content standards.",
    url: "https://promptking.in/adsense-policy",
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing AdSense Policy',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AdSense Policy - PromptKing | Ad Compliance Guidelines",
    description: "Read PromptKing's AdSense compliance policy detailing our adherence to Google AdSense terms and content standards.",
    images: ['https://promptking.in/og-image.jpg'],
  }
};

export default function AdsensePolicyLayout({ children }) {
  return children;
}
