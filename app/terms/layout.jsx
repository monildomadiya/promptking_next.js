export const metadata = {
  title: "Terms and Conditions - PromptKing | Usage Agreement",
  description: "Review PromptKing's Terms and Conditions. Understand your rights, responsibilities, and the rules governing use of our AI prompts library and platform services.",
  alternates: {
    canonical: "https://promptking.in/terms",
  },
  openGraph: {
    title: "Terms and Conditions - PromptKing | Usage Agreement",
    description: "Review PromptKing's Terms and Conditions. Understand the rules governing use of our AI prompts library and platform services.",
    url: "https://promptking.in/terms",
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing Terms and Conditions',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Terms and Conditions - PromptKing | Usage Agreement",
    description: "Review PromptKing's Terms and Conditions. Understand the rules governing use of our AI prompts library and platform services.",
    images: ['https://promptking.in/og-image.jpg'],
  }
};

export default function TermsLayout({ children }) {
  return children;
}
