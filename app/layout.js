import "./globals.css";
import Script from "next/script";
import { GoogleAnalytics } from '@next/third-parties/google';

import { AppProvider } from "@/components/AppContext";
import ClientLayout from "./ClientLayout";

export const metadata = {
  metadataBase: new URL('https://promptking.in'),
  title: "PromptKing - Free & Premium AI Prompts Library for ChatGPT, Midjourney & More",
  description: "Discover 1000+ free and premium AI prompts for ChatGPT, Midjourney, Claude, Gemini, and more. Browse by category, copy instantly, and elevate your AI engineering skills with PromptKing.",
  alternates: {
    canonical: 'https://promptking.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://promptking.in',
    title: 'PromptKing - Free & Premium AI Prompts Library',
    description: 'Discover 1000+ free and premium AI prompts for ChatGPT, Midjourney, Claude, and more. Elevate your AI engineering skills.',
    siteName: 'PromptKing',
    images: [
      {
        url: 'https://promptking.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PromptKing - Premium AI Prompts Library',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptKing - Free & Premium AI Prompts',
    description: 'Discover 1000+ free and premium AI prompts for ChatGPT, Midjourney, Claude and more. Start exploring today!',
    images: ['https://promptking.in/og-image.png'],
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
};

const GA_ID = "G-1HK9T17LSR";

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PromptKing',
    url: 'https://promptking.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://promptking.in/?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PromptKing',
    url: 'https://promptking.in',
    logo: 'https://promptking.in/promptking-logo.svg',
    sameAs: [
      // Add social links here if needed
    ]
  };

  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2762946314678354"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>

        <script id="json-ld-website" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script id="json-ld-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <GoogleAnalytics gaId={GA_ID} />

        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}
