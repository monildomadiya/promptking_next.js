"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import GameShell from '@/components/Games/GameShell';
import { Target, Zap, Crown, ArrowRight, Clock } from '@/components/Common/Icons';
import { GAME_KEYS, readGame } from '@/lib/gameStorage';
import { optimizeImage } from '@/utils/imageUtils';

const GAMES = [
  {
    href: '/games/guess-the-prompt',
    Icon: Target,
    name: 'Guess the Prompt',
    blurb: 'We show the picture. You pick which of four prompts made it. Ten rounds, a clock on every one.',
    meta: '~2 min per round',
  },
  {
    href: '/games/prompt-battle',
    Icon: Zap,
    name: 'Prompt Battle',
    blurb: 'Two AI images, one tap. The winner stays on and takes the next challenger. How long can a champion survive?',
    meta: 'Endless',
  },
  {
    href: '/games/daily-spin',
    Icon: Crown,
    name: 'Daily Spin',
    blurb: 'One spin a day. Land on a premium prompt and its unlock PIN is yours until midnight.',
    meta: 'Once every 24h',
  },
];

export default function ClientGamesHub({ deckSize, premiumCount, previews = [] }) {
  // Read after mount, never during render: the server has no localStorage, so
  // reading it inline would render 0 on the server and a real score on the
  // client — a hydration mismatch on every returning player's first paint.
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats({
      best: Number(readGame(GAME_KEYS.quizBest, 0)) || 0,
      rounds: Number(readGame(GAME_KEYS.quizRounds, 0)) || 0,
      streak: Number(readGame(GAME_KEYS.battleBestStreak, 0)) || 0,
      puzzles: Number(readGame(GAME_KEYS.puzzlesSolved, 0)) || 0,
    });
  }, []);

  return (
    <GameShell
      hideBack
      eyebrow="Play"
      title="PromptKing"
      accentWord="Games"
      subtitle={`Three quick games built on all ${deckSize} prompts in the library. No sign-up, no download — and every round ends with a real prompt you can copy.`}
    >
      <style>{hubStyles}</style>

      {previews.length > 0 && (
        <div className="pk-hub-strip" aria-hidden="true">
          {previews.map((src, i) => (
            <img key={i} src={optimizeImage(src, 200)} alt="" loading="lazy" decoding="async" />
          ))}
        </div>
      )}

      <div className="pk-hub-grid">
        {GAMES.map(({ href, Icon, name, blurb, meta }) => (
          <Link key={href} href={href} className="pk-hub-card">
            <span className="pk-hub-icon">
              <Icon size={22} />
            </span>
            <span className="pk-hub-name">{name}</span>
            <span className="pk-hub-blurb">{blurb}</span>
            <span className="pk-hub-foot">
              <span className="pk-hub-meta">
                <Clock size={13} /> {meta}
              </span>
              <span className="pk-hub-play">
                Play <ArrowRight size={14} />
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* Rendered only once the real numbers exist — a row of zeroes on first
          visit reads as a broken feature rather than an empty one. */}
      {stats && (stats.best > 0 || stats.rounds > 0 || stats.streak > 0 || stats.puzzles > 0) && (
        <section className="pk-hub-stats">
          <h2 className="pk-hub-h2">Your records</h2>
          {/* Only records actually earned. A row of zeroes beside one real
              number reads as three broken games rather than three unplayed
              ones — and the puzzle stat is earned on prompt pages, not here. */}
          <div className="pk-stats">
            {[
              { value: stats.best, label: 'Best score' },
              { value: stats.rounds, label: 'Rounds played' },
              { value: stats.streak, label: 'Longest reign' },
              { value: stats.puzzles, label: 'Puzzles solved' },
            ]
              .filter(({ value }) => value > 0)
              .map(({ value, label }) => (
                <div className="pk-stat" key={label}>
                  <span className="pk-stat-value">{value}</span>
                  <span className="pk-stat-label">{label}</span>
                </div>
              ))}
          </div>
          <p className="pk-hub-note">
            Saved in this browser only — no account, nothing sent to a server.
          </p>
        </section>
      )}

      {/* Crawlable, descriptive links out of a page that is otherwise a menu of
          three. The prompt library is what we actually want indexed. */}
      <nav className="pk-hub-out" aria-label="Browse prompts">
        <Link href="/">Browse all {deckSize} prompts</Link>
        <Link href="/categories">Prompts by category</Link>
        {premiumCount > 0 && (
          <Link href="/">{premiumCount} premium {premiumCount === 1 ? 'prompt' : 'prompts'}</Link>
        )}
        <Link href="/faq">How unlocking works</Link>
      </nav>
    </GameShell>
  );
}

const hubStyles = `
.pk-hub-strip {
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  margin-bottom: 34px;
}
.pk-hub-strip img {
  width: 92px; height: 62px; object-fit: cover; border-radius: 12px;
  border: 1px solid rgba(15,23,42,0.08);
}

.pk-hub-grid {
  display: grid; gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.pk-hub-card {
  display: flex; flex-direction: column;
  background: #fff; border: 1px solid rgba(15,23,42,0.08);
  border-radius: 22px; padding: 26px 24px; text-decoration: none;
  box-shadow: 0 6px 20px rgba(17,24,39,0.05);
  transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease, border-color 0.28s ease;
}
.pk-hub-card:hover {
  transform: translateY(-5px);
  border-color: rgba(229,9,20,0.32);
  box-shadow: 0 18px 38px rgba(15,23,42,0.1);
}
.pk-hub-icon {
  width: 46px; height: 46px; border-radius: 14px; margin-bottom: 16px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(229,9,20,0.07); border: 1px solid rgba(229,9,20,0.18);
  color: var(--accent-main);
}
.pk-hub-name { font-size: 1.22rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.pk-hub-blurb { font-size: 0.92rem; line-height: 1.6; color: var(--text-secondary); flex: 1; }
.pk-hub-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(15,23,42,0.07);
}
.pk-hub-meta {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.76rem; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: var(--text-muted);
}
.pk-hub-play {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.9rem; font-weight: 800; color: var(--accent-main);
}

.pk-hub-stats { margin-top: 48px; text-align: center; }
.pk-hub-h2 { font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin: 0 0 16px; }
.pk-hub-note { font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 0; }

.pk-hub-out {
  display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
  margin-top: 48px; padding-top: 28px; border-top: 1px solid rgba(15,23,42,0.07);
}
.pk-hub-out a {
  padding: 9px 16px; border-radius: 50px; font-size: 0.82rem; font-weight: 700;
  background: rgba(15,23,42,0.04); border: 1px solid rgba(15,23,42,0.08);
  color: var(--text-secondary); text-decoration: none;
}
.pk-hub-out a:hover { background: rgba(15,23,42,0.08); color: var(--text-main); }
`;
