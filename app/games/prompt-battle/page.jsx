import ClientBattleGame from './ClientBattleGame';
import { fetchGameDeck } from '@/lib/games';

export const revalidate = 60;

export const metadata = {
  title: 'Prompt Battle - Vote on AI Images | PromptKing',
  description: 'Two AI images, one tap. The winner stays on and faces the next challenger. Build your own hall of fame of the best AI prompts — free, no sign-up.',
  alternates: {
    canonical: 'https://promptking.in/games/prompt-battle',
  },
  openGraph: {
    title: 'Prompt Battle - Vote on AI Images | PromptKing',
    description: 'Two AI images, one tap. The winner stays on. How long can a champion survive?',
    url: 'https://promptking.in/games/prompt-battle',
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Prompt Battle game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Battle - Vote on AI Images | PromptKing',
    description: 'Two AI images, one tap. The winner stays on. How long can a champion survive?',
    images: ['https://promptking.in/og-image.jpg'],
  },
};

export default async function PromptBattlePage() {
  const deck = await fetchGameDeck();
  return <ClientBattleGame deck={deck} />;
}
