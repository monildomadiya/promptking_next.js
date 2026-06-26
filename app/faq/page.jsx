import React from 'react';
import db from '@/lib/db';
import ClientFAQ from './ClientFAQ';

export const metadata = {
  title: 'Frequently Asked Questions - PromptKing | Help & Support',
  description: 'Find answers to the most common questions about PromptKing — how to use AI prompts, billing, free vs premium plans, supported AI tools like ChatGPT & Midjourney, and more.',
  alternates: {
    canonical: 'https://promptking.in/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions - PromptKing | Help & Support',
    description: 'Find answers to the most common questions about PromptKing — AI prompts, billing, free vs premium plans, and supported tools.',
    url: 'https://promptking.in/faq',
  }
};

export default async function FAQServerPage() {
  let faqs = [];
  try {
    const rows = await db`SELECT * FROM faqs ORDER BY id ASC`;
    if (rows && rows.length > 0) {
      faqs = rows;
    }
  } catch (err) {
    console.error('Failed to fetch FAQs:', err);
  }

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <ClientFAQ initialFaqs={faqs} />
    </>
  );
}
