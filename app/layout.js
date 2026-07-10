import "./globals.css";
import Script from "next/script";
import { GoogleAnalytics } from '@next/third-parties/google';

import { AppProvider } from "@/components/AppContext";
import ClientLayout from "./ClientLayout";

export const metadata = {
  metadataBase: new URL('https://promptking.in'),
  title: "PromptKing – Best AI Prompts for ChatGPT, Gemini & Midjourney",
  description: "Explore 1000+ free AI prompts for ChatGPT, Gemini, and Midjourney. Copy ready-to-use prompts for writing, coding, design, and more — all in one place.",
  alternates: {
    canonical: 'https://promptking.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://promptking.in',
    title: 'PromptKing – Best AI Prompts for ChatGPT, Gemini & Midjourney',
    description: 'Explore 1000+ free AI prompts for ChatGPT, Gemini, and Midjourney. Copy ready-to-use prompts for writing, coding, design, and more — all in one place.',
    siteName: 'PromptKing',
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing - Premium AI Prompts Library',
        type: 'image/jpeg',
      },
      {
        url: 'https://promptking.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PromptKing - Premium AI Prompts Library',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptKing – Best AI Prompts for ChatGPT, Gemini & Midjourney',
    description: 'Explore 1000+ free AI prompts for ChatGPT, Gemini, and Midjourney. Copy ready-to-use prompts for writing, coding, design, and more — all in one place.',
    images: ['https://promptking.in/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-adsense-account': 'ca-pub-2762946314678354',
  },
};

const GA_ID = "G-1HK9T17LSR";

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PromptKing',
    url: 'https://promptking.in',
    description: 'The ultimate free AI prompt library with 1000+ expert-engineered prompts for ChatGPT, Gemini, Midjourney, Claude, and more.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://promptking.in/?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PromptKing',
    url: 'https://promptking.in',
    logo: {
      '@type': 'ImageObject',
      url: 'https://promptking.in/promptking-logo.svg',
      width: 180,
      height: 60,
    },
    description: 'PromptKing is the world\'s leading free AI prompt library, providing 1000+ expert-engineered prompts for ChatGPT, Gemini, Midjourney, and Claude.',
    foundingDate: '2024',
    areaServed: 'Worldwide',
    knowsAbout: [
      'AI Prompts',
      'Prompt Engineering',
      'ChatGPT',
      'Midjourney',
      'Google Gemini',
      'Claude AI',
      'Generative AI',
      'Image Generation',
      'Text Generation'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: 'https://promptking.in/contact',
      availableLanguage: 'English'
    },
    sameAs: []
  };

  return (
    <html lang="en">
      <head>
        <Script
          id="adsbygoogle-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2762946314678354"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <script
          id="json-ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          id="json-ld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <GoogleAnalytics gaId={GA_ID} />

        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}
