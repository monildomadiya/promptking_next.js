
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { GoogleAnalytics } from '@next/third-parties/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AppProvider } from "@/components/AppContext";
import ClientLayout from "./ClientLayout";

export const metadata = {
  metadataBase: new URL('https://promptking.in'),
  title: "PromptKing - Premium AI Prompts Library",
  description: "Discover 1000+ free and premium AI prompts for ChatGPT, Midjourney, Claude, and more. Elevate your AI engineering skills.",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://promptking.in',
    title: 'PromptKing - Premium AI Prompts Library',
    description: 'Discover 1000+ free and premium AI prompts for ChatGPT, Midjourney, Claude, and more.',
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
    title: 'PromptKing - Premium AI Prompts',
    description: 'Discover high-quality AI prompts for ChatGPT, Midjourney, and more.',
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body>
        <GoogleAnalytics gaId={GA_ID} />

        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}
