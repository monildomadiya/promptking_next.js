import ClientGamesHub from './ClientGamesHub';
import { fetchGameDeck } from '@/lib/games';

// Same cadence as the rest of the site: the deck is just the prompt library.
export const revalidate = 60;

export const metadata = {
  title: 'AI Prompt Games - Play & Discover Prompts | PromptKing',
  description: 'Free AI prompt games: guess which prompt made the image, vote in prompt battles, and spin for a free premium unlock every day. No sign-up needed.',
  alternates: {
    canonical: 'https://promptking.in/games',
  },
  openGraph: {
    title: 'AI Prompt Games - Play & Discover Prompts | PromptKing',
    description: 'Guess the prompt, battle the best AI images, and win a free premium unlock every day. Three quick games built on the PromptKing library.',
    url: 'https://promptking.in/games',
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Prompt Games - Play & Discover Prompts | PromptKing',
    description: 'Guess the prompt, battle the best AI images, and win a free premium unlock every day.',
    images: ['https://promptking.in/og-image.jpg'],
  },
};

export default async function GamesPage() {
  const deck = await fetchGameDeck();

  // The hub only needs a few thumbnails for the card art and a headline count;
  // shipping all ~100 cards to a page nobody plays on would be wasteful.
  return (
    <ClientGamesHub
      deckSize={deck.length}
      premiumCount={deck.filter((c) => c.isPremium).length}
      previews={deck.slice(0, 6).map((c) => c.image)}
    />
  );
}
