import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';

// Plain inline script: it has to run before the Google tags load, which rules
// out anything that waits for React. The storage key and shape are the ones
// CookieConsentBanner writes.
const CONSENT_DEFAULTS_SCRIPT = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
var eea = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];
var choice = null;
try { choice = JSON.parse(localStorage.getItem('pk_cookie_consent')); } catch (e) {}
if (choice) {
  // A choice the visitor made wins everywhere — no regional default here,
  // because Google lets a region-specific default override a global one.
  var ads = choice.advertising ? 'granted' : 'denied';
  window.gtag('consent', 'default', { ad_storage: ads, ad_user_data: ads, ad_personalization: ads, analytics_storage: choice.analytics ? 'granted' : 'denied' });
  if (!choice.advertising) (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
} else {
  window.gtag('consent', 'default', { region: eea, wait_for_update: 500, ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
  window.gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
}
`;

import { AppProvider } from "@/components/AppContext";
import ClientLayout from "./ClientLayout";

export const metadata = {
  metadataBase: new URL('https://promptking.in'),
  title: "PromptKing – Best AI Prompts for ChatGPT, Gemini & Midjourney",
  description: "Explore 100+ free AI prompts for ChatGPT, Gemini, and Midjourney. Copy ready-to-use prompts for writing, coding, design, and more — all in one place.",
  keywords: [
    "AI prompts", "ChatGPT prompts", "Midjourney prompts", "Gemini prompts",
    "free AI prompts", "prompt engineering", "AI image generator prompts",
    "AI headshot generator", "AI photo editor", "AI logo maker",
    "AI art generator", "text to image prompts", "AI content writing",
    "AI marketing prompts", "AI resume builder", "AI business ideas",
    "DALL-E prompts", "Stable Diffusion prompts", "prompt library",
    "best AI prompts 2026", "viral AI photo trends", "AI selfie generator",
  ],
  alternates: {
    canonical: 'https://promptking.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://promptking.in',
    title: 'PromptKing – Best AI Prompts for ChatGPT, Gemini & Midjourney',
    description: 'Explore 100+ free AI prompts for ChatGPT, Gemini, and Midjourney. Copy ready-to-use prompts for writing, coding, design, and more — all in one place.',
    siteName: 'PromptKing',
    // One og:image only. Shipping both a .jpg and a .png meant every page
    // carried two og:image blocks; crawlers take the first and ignore the rest.
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing - Premium AI Prompts Library',
        type: 'image/jpeg',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptKing – Best AI Prompts for ChatGPT, Gemini & Midjourney',
    description: 'Explore 100+ free AI prompts for ChatGPT, Gemini, and Midjourney. Copy ready-to-use prompts for writing, coding, design, and more — all in one place.',
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
    description: 'A free AI prompt library of hand-tested, expert-engineered prompts for ChatGPT, Gemini, Midjourney, Claude, and more.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        // Must match the parameter the site actually reads (?search=), not ?q=.
        urlTemplate: 'https://promptking.in/?search={search_term_string}'
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
    description: 'PromptKing is a free AI prompt library providing hand-tested, expert-engineered prompts for ChatGPT, Gemini, Midjourney, and Claude.',
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
        {/* Preload above-the-fold font weights so Outfit is ready before first
            paint. Combined with font-display:optional this prevents the hero
            title from re-wrapping (layout shift) when the font loads.
            WOFF2 only — preloading the TTF as well would double-download. */}
        <link rel="preload" href="/assets/fonts/Outfit-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/assets/fonts/Outfit-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/assets/fonts/Outfit-Black.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* adsbygoogle.js is loaded from ClientLayout, not here: this is a server
            component with no route awareness, so loading it here put Auto Ads on
            /admin-secure too. */}
        {/* Consent, before any Google tag runs. The cookie banner used to store
            the visitor's choice and nothing ever read it, so "Reject Optional"
            still got analytics and personalised ads. This reads it first:
            - Consent Mode tells Analytics and Google's ad tags what is allowed;
            - requestNonPersonalizedAds is AdSense's own switch for the same.
            With no choice made yet, visitors in the EEA, UK and Switzerland
            start as "denied" (Google requires it there); everyone else as
            "granted" until they say otherwise. */}
        <script
          id="consent-defaults"
          dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULTS_SCRIPT }}
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
