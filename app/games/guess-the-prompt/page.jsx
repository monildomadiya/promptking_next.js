import ClientGuessGame from './ClientGuessGame';
import { fetchGameDeck } from '@/lib/games';

export const revalidate = 60;

export const metadata = {
  title: 'Guess the Prompt - AI Image Quiz | PromptKing',
  description: 'Can you tell which AI prompt made the picture? Ten rounds, four options each, a clock on every one. Free browser quiz built on real ChatGPT and Midjourney prompts.',
  alternates: {
    canonical: 'https://promptking.in/games/guess-the-prompt',
  },
  openGraph: {
    title: 'Guess the Prompt - AI Image Quiz | PromptKing',
    description: 'We show the picture, you pick the prompt that made it. Ten rounds against the clock.',
    url: 'https://promptking.in/games/guess-the-prompt',
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Guess the Prompt quiz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guess the Prompt - AI Image Quiz | PromptKing',
    description: 'We show the picture, you pick the prompt that made it. Ten rounds against the clock.',
    images: ['https://promptking.in/og-image.jpg'],
  },
};

export default async function GuessThePromptPage() {
  const deck = await fetchGameDeck();
  return <ClientGuessGame deck={deck} />;
}
