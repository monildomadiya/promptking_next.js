import ClientSpinGame from './ClientSpinGame';
import { fetchDailyPrize } from '@/lib/games';

// The prize is keyed to the UTC date, so the page must not be cached past the
// day it was built for. Ten minutes keeps it cheap without letting yesterday's
// prize survive far into today.
export const revalidate = 600;

export const metadata = {
  title: 'Daily Spin - Win a Free Premium Prompt | PromptKing',
  description: 'Spin once a day to unlock a premium AI prompt for free. A new prompt goes on the wheel every 24 hours — no sign-up, no payment.',
  alternates: {
    canonical: 'https://promptking.in/games/daily-spin',
  },
  openGraph: {
    title: 'Daily Spin - Win a Free Premium Prompt | PromptKing',
    description: 'One spin a day. Land on a premium prompt and its unlock PIN is yours.',
    url: 'https://promptking.in/games/daily-spin',
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing Daily Spin',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Spin - Win a Free Premium Prompt | PromptKing',
    description: 'One spin a day. Land on a premium prompt and its unlock PIN is yours.',
    images: ['https://promptking.in/og-image.jpg'],
  },
};

export default async function DailySpinPage() {
  const { dayKey, segments, prizeIndex, prize } = await fetchDailyPrize();
  return (
    <ClientSpinGame dayKey={dayKey} segments={segments} prizeIndex={prizeIndex} prize={prize} />
  );
}
