export const metadata = {
  title: "About Us - PromptKing | Our Mission & Story",
  description: "Discover the story behind PromptKing — the ultimate AI prompts library for ChatGPT, Midjourney, Claude & more. Learn about our mission to empower creators with powerful prompts.",
  alternates: {
    canonical: "https://promptking.in/about",
  },
  openGraph: {
    title: "About Us - PromptKing | Our Mission & Story",
    description: "Discover the story behind PromptKing — the ultimate AI prompts library for ChatGPT, Midjourney, Claude & more.",
    url: "https://promptking.in/about",
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'About PromptKing',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "About Us - PromptKing | Our Mission & Story",
    description: "Discover the story behind PromptKing — the ultimate AI prompts library for ChatGPT, Midjourney, Claude & more.",
    images: ['https://promptking.in/og-image.jpg'],
  }
};

export default function AboutLayout({ children }) {
  return children;
}
