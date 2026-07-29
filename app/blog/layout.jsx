export const metadata = {
  title: "PromptKing Blog - AI Prompt Tips, Guides & Updates",
  description: "Explore expert tutorials, creative tips, and the latest news about AI prompts, ChatGPT, Midjourney, Gemini, Claude, and prompt engineering — all in one place.",
  keywords: "promptking blog, ai prompt tips, chatgpt guide, midjourney tutorial, ai workflow, prompt engineering blog",
  alternates: {
    canonical: "https://promptking.in/blog",
  },
  openGraph: {
    title: "PromptKing Blog - AI Prompt Tips, Guides & Updates",
    description: "Explore expert tutorials, creative tips, and the latest news about AI prompts, ChatGPT, Midjourney, Gemini, Claude, and prompt engineering.",
    url: "https://promptking.in/blog",
    type: "website",
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing Blog',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptKing Blog - AI Tips & Updates",
    description: "Expert insights, tutorials, and news about AI prompts, creative workflows, and the latest from the PromptKing platform.",
    images: ['https://promptking.in/og-image.jpg'],
  }
};

export default function BlogLayout({ children }) {
  return children;
}
