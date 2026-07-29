export const metadata = {
  title: "Disclaimer - PromptKing | Important Notice",
  description: "Read the official disclaimer for PromptKing. Understand the limitations of liability, accuracy of AI-generated prompts, and important notices about using our platform.",
  alternates: {
    canonical: "https://promptking.in/disclaimer",
  },
  openGraph: {
    title: "Disclaimer - PromptKing | Important Notice",
    description: "Read the official disclaimer for PromptKing. Understand limitations of liability and important notices about our AI prompts platform.",
    url: "https://promptking.in/disclaimer",
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing Disclaimer',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Disclaimer - PromptKing | Important Notice",
    description: "Read the official disclaimer for PromptKing. Understand limitations of liability and important notices about our AI prompts platform.",
    images: ['https://promptking.in/og-image.jpg'],
  }
};

export default function DisclaimerLayout({ children }) {
  return children;
}
