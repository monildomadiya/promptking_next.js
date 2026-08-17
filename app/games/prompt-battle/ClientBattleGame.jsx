"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import GameShell from '@/components/Games/GameShell';
import { Crown, Zap, ExternalLink, Award } from '@/components/Common/Icons';
import { GAME_KEYS, readBattleTop, readGame, recordBattleVote, writeBest } from '@/lib/gameStorage';
import { optimizeImage } from '@/utils/imageUtils';

const MIN_DECK = 2;
const SWAP_MS = 260; // long enough to see the winner flash, short enough to keep tapping

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function ClientBattleGame({ deck = [] }) {
  const playable = useMemo(() => deck.filter((c) => c.image && c.label), [deck]);

  const [champion, setChampion] = useState(null);
  const [challenger, setChallenger] = useState(null);
  const [reign, setReign] = useState(0);
  const [votes, setVotes] = useState(0);
  const [bestReign, setBestReign] = useState(0);
  const [flash, setFlash] = useState(null);
  const [top, setTop] = useState([]);

  // Draw challengers from a shuffled bag rather than picking at random each
  // time: pure random repeats the same face three fights in a row on a deck
  // this size, which reads as the game being broken.
  const bagRef = useRef([]);
  const lockRef = useRef(false);

  const drawFrom = useCallback((exclude) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      while (bagRef.current.length) {
        const card = bagRef.current.pop();
        if (card.key !== exclude?.key) return card;
      }
      bagRef.current = shuffle(playable);
    }
    return null;
  }, [playable]);

  const start = useCallback(() => {
    bagRef.current = shuffle(playable);
    const first = drawFrom(null);
    const second = drawFrom(first);
    setChampion(first);
    setChallenger(second);
    setReign(0);
    setVotes(0);
    setFlash(null);
    lockRef.current = false;
  }, [playable, drawFrom]);

  // Shuffle after mount, not during render — the server would otherwise pick a
  // different opening pair than the browser and hydration would fail.
  useEffect(() => {
    if (playable.length < MIN_DECK) return;
    setBestReign(Number(readGame(GAME_KEYS.battleBestStreak, 0)) || 0);
    setTop(readBattleTop());
    start();
  }, [playable.length, start]);

  const vote = useCallback((side) => {
    if (lockRef.current || !champion || !challenger) return;
    lockRef.current = true;

    const winner = side === 'champion' ? champion : challenger;
    const keepsReign = side === 'champion';

    setFlash(side);
    recordBattleVote(winner);

    setTimeout(() => {
      const nextReign = keepsReign ? reign + 1 : 1;
      setReign(nextReign);
      setBestReign(writeBest(GAME_KEYS.battleBestStreak, nextReign));
      setVotes((v) => v + 1);
      setChampion(winner);
      setChallenger(drawFrom(winner));
      setTop(readBattleTop());
      setFlash(null);
      lockRef.current = false;
    }, SWAP_MS);
  }, [champion, challenger, reign, drawFrom]);

  // Arrow keys for anyone playing on a laptop — the game is a lot of repeated
  // taps and reaching for the mouse every time gets old fast.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') vote('champion');
      else if (e.key === 'ArrowRight') vote('challenger');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [vote]);

  const shell = {
    eyebrow: 'Game 2',
    title: 'Prompt',
    accentWord: 'Battle',
    subtitle: 'Two AI images, one tap. Whichever you pick stays on and faces the next challenger — how long can a single prompt hold the crown?',
  };

  if (playable.length < MIN_DECK) {
    return (
      <GameShell {...shell}>
        <div className="pk-panel" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            This game needs at least {MIN_DECK} prompts with images. There are {playable.length} right now.
          </p>
          <Link href="/" className="pk-btn">Browse prompts</Link>
        </div>
      </GameShell>
    );
  }

  if (!champion || !challenger) {
    return (
      <GameShell {...shell}>
        <div className="pk-panel" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Setting up the ring…
        </div>
      </GameShell>
    );
  }

  const sides = [
    { side: 'champion', card: champion, isChampion: reign > 0 },
    { side: 'challenger', card: challenger, isChampion: false },
  ];

  return (
    <GameShell {...shell}>
      <style>{battleStyles}</style>

      <div className="pk-stats">
        <div className="pk-stat">
          <span className="pk-stat-value">{reign}</span>
          <span className="pk-stat-label">Current reign</span>
        </div>
        <div className="pk-stat">
          <span className="pk-stat-value">{bestReign}</span>
          <span className="pk-stat-label">Longest reign</span>
        </div>
        <div className="pk-stat">
          <span className="pk-stat-value">{votes}</span>
          <span className="pk-stat-label">Battles</span>
        </div>
      </div>

      <div className="pk-arena">
        {sides.map(({ side, card, isChampion }) => (
          <div key={side} className={`pk-fighter ${flash === side ? 'is-won' : ''}`}>
            <button type="button" className="pk-fighter-btn" onClick={() => vote(side)}>
              <span className="pk-media">
                <img src={optimizeImage(card.image, 700)} alt={card.title} decoding="async" />
                {isChampion && (
                  <span className="pk-crown">
                    <Crown size={13} fill="#ffd166" /> Champion · {reign}
                  </span>
                )}
              </span>
              <span className="pk-fighter-name">{card.label}</span>
              <span className="pk-fighter-cta">
                <Zap size={14} /> Pick this one
              </span>
            </button>
            <Link href={`/prompt/${card.slug}`} className="pk-fighter-link">
              Open prompt <ExternalLink size={12} />
            </Link>
          </div>
        ))}
        <span className="pk-vs" aria-hidden="true">VS</span>
      </div>

      <p className="pk-hint">Tap a picture, or use ← and → on a keyboard.</p>

      {top.length > 0 && (
        <section className="pk-hall">
          <h2 className="pk-hall-h">
            <Award size={16} /> Your hall of fame
          </h2>
          <div className="pk-recap">
            {top.map((entry) => (
              <Link key={entry.key} href={`/prompt/${entry.slug}`} className="pk-recap-row">
                <img src={optimizeImage(entry.image, 120)} alt="" loading="lazy" decoding="async" />
                <span className="pk-recap-title">{entry.label}</span>
                <span className="pk-recap-wins">{entry.wins} {entry.wins === 1 ? 'win' : 'wins'}</span>
              </Link>
            ))}
          </div>
          <p className="pk-hall-note">Your votes, kept in this browser. Nothing is sent anywhere.</p>
        </section>
      )}

      <div className="pk-btn-row">
        <button type="button" className="pk-btn pk-btn-ghost" onClick={start}>New matchup</button>
        <Link href="/games" className="pk-btn pk-btn-ghost">More games</Link>
      </div>
    </GameShell>
  );
}

const battleStyles = `
.pk-arena { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.pk-fighter {
  background: #fff; border: 1.5px solid rgba(15,23,42,0.08); border-radius: 22px;
  padding: 12px 12px 10px; box-shadow: 0 8px 24px rgba(17,24,39,0.06);
  transition: transform 0.24s cubic-bezier(0.16,1,0.3,1), border-color 0.24s ease, box-shadow 0.24s ease;
  display: flex; flex-direction: column;
}
.pk-fighter:hover { border-color: rgba(229,9,20,0.3); }
.pk-fighter.is-won {
  transform: scale(1.03);
  border-color: #0f9d76;
  box-shadow: 0 0 0 3px rgba(15,157,118,0.18), 0 14px 32px rgba(15,157,118,0.2);
}

.pk-fighter-btn {
  display: flex; flex-direction: column; gap: 10px;
  background: none; border: none; padding: 0; cursor: pointer;
  text-align: left; width: 100%; flex: 1;
}
.pk-fighter-btn .pk-media { aspect-ratio: 1 / 1; display: block; }
.pk-fighter-name {
  font-size: 0.9rem; font-weight: 700; line-height: 1.4; color: var(--text-main);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  min-height: 2.5em;
}
.pk-fighter-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border-radius: 12px; margin-top: auto;
  background: rgba(229,9,20,0.06); border: 1px solid rgba(229,9,20,0.16);
  color: var(--accent-main); font-size: 0.82rem; font-weight: 800;
  transition: background 0.2s ease;
}
.pk-fighter-btn:hover .pk-fighter-cta { background: rgba(229,9,20,0.12); }

.pk-crown {
  position: absolute; top: 10px; left: 10px;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 11px; border-radius: 30px;
  background: rgba(0,0,0,0.66); color: #ffd166;
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.3px;
}

.pk-fighter-link {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  margin-top: 8px; padding: 7px; border-radius: 10px;
  font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-decoration: none;
}
.pk-fighter-link:hover { color: var(--accent-main); background: rgba(15,23,42,0.03); }

.pk-vs {
  position: absolute; top: 34%; left: 50%; transform: translate(-50%, -50%);
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--text-main); color: #fff;
  font-size: 0.78rem; font-weight: 800; letter-spacing: 0.5px;
  box-shadow: 0 6px 18px rgba(15,23,42,0.3); pointer-events: none; z-index: 2;
}

.pk-hint { text-align: center; font-size: 0.82rem; color: var(--text-muted); margin: 18px 0 0; }

.pk-hall { margin-top: 44px; padding-top: 28px; border-top: 1px solid rgba(15,23,42,0.07); }
.pk-hall-h {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.8rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: var(--text-muted); margin: 0 0 14px;
}
.pk-hall-note { font-size: 0.78rem; color: var(--text-muted); margin: 12px 0 0; text-align: center; }

.pk-recap { display: grid; gap: 8px; }
.pk-recap-row {
  display: flex; align-items: center; gap: 13px; text-decoration: none;
  padding: 9px 13px; border-radius: 14px;
  background: #f8fafc; border: 1px solid rgba(15,23,42,0.07);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.pk-recap-row:hover { background: #fff; border-color: rgba(229,9,20,0.3); }
.pk-recap-row img { width: 56px; height: 36px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.pk-recap-title {
  flex: 1; font-size: 0.88rem; font-weight: 600; color: var(--text-main);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pk-recap-wins {
  font-size: 0.74rem; font-weight: 800; color: var(--accent-main);
  background: rgba(229,9,20,0.08); padding: 4px 10px; border-radius: 20px; flex-shrink: 0;
}

@media (max-width: 560px) {
  .pk-arena { gap: 10px; }
  .pk-fighter { padding: 8px 8px 6px; border-radius: 18px; }
  .pk-fighter-name { font-size: 0.78rem; min-height: 2.3em; }
  .pk-fighter-cta { font-size: 0.72rem; padding: 9px 6px; }
  .pk-vs { width: 36px; height: 36px; font-size: 0.68rem; }
}
`;
