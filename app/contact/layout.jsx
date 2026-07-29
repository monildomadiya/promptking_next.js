export const metadata = {
  title: "Contact Us - PromptKing | Get in Touch",
  description: "Have a question or want to collaborate? Contact the PromptKing team for support, partnership inquiries, feedback, or general help with our AI prompts platform.",
  alternates: {
    canonical: "https://promptking.in/contact",
  },
  openGraph: {
    title: "Contact Us - PromptKing | Get in Touch",
    description: "Have a question or want to collaborate? Contact the PromptKing team for support, partnership inquiries, and feedback.",
    url: "https://promptking.in/contact",
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact PromptKing',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Contact Us - PromptKing | Get in Touch",
    description: "Have a question or want to collaborate? Contact the PromptKing team for support, partnership inquiries, and feedback.",
    images: ['https://promptking.in/og-image.jpg'],
  }
};

export default function ContactLayout({ children }) {
  return children;
}
