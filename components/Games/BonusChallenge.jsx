"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import PuzzleBoard from '@/components/Games/PuzzleBoard';
import { Puzzle, ArrowRight, Award } from '@/components/Common/Icons';
import { recordPuzzleSolve } from '@/lib/gameStorage';

/**
 * The free-prompt version of the picture puzzle.
 *
 * It gates nothing. The prompt text is already on screen and already copyable
 * above this panel, and it stays that way whether or not anyone ever taps
 * "Start" — a visitor who arrived from Google for this prompt gets what they
 * came for immediately. This is here for the ones who linger.
 *
 * Collapsed by default for the same reason: an expanded puzzle board sitting
 * under every free prompt reads as another thing in the way.
 */
export default function BonusChallenge({ image }) {
  const [stage, setStage] = useState('idle'); // idle | playing | done
  const [result, setResult] = useState(null);

  const solve = async (moves) => {
    setResult({ moves, ...recordPuzzleSolve(moves) });
    setStage('done');

    try {
      const confetti = (await import('canvas-confetti')).default;
      const panel = document.getElementById('bonus-challenge');
      if (!panel) return;
      const box = panel.getBoundingClientRect();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: {
          x: (box.left + box.width / 2) / window.innerWidth,
          y: (box.top + box.height / 2) / window.innerHeight,
        },
        colors: ['#e50914', '#FFD700'],
        zIndex: 9999,
      });
    } catch {
      // Confetti is decoration; a failed chunk load shouldn't swallow the win.
    }
  };

  return (
    <section id="bonus-challenge" className="pk-bonus">
      <style>{bonusStyles}</style>

      {stage === 'idle' && (
        <div className="pk-bonus-idle">
          <span className="pk-bonus-icon"><Puzzle size={20} /></span>
          <div className="pk-bonus-text">
            <strong>Bonus challenge</strong>
            <span>Rebuild this image from nine shuffled tiles. Takes about a minute.</span>
          </div>
          <button type="button" className="pk-bonus-start" onClick={() => setStage('playing')}>
            Start <ArrowRight size={15} />
          </button>
        </div>
      )}

      {stage === 'playing' && (
        <div className="pk-bonus-play">
          <PuzzleBoard
            image={image}
            onSolved={solve}
            onCancel={() => setStage('idle')}
            cancelLabel="Close"
            solvedTitle="Solved!"
          />
        </div>
      )}

      {stage === 'done' && (
        <div className="pk-bonus-done">
          <span className="pk-bonus-icon is-win"><Award size={20} /></span>
          <div className="pk-bonus-text">
            <strong>Solved in {result.moves} {result.moves === 1 ? 'move' : 'moves'}</strong>
            <span>
              {result.solved} {result.solved === 1 ? 'puzzle' : 'puzzles'} solved · best {result.fewest} moves
            </span>
          </div>
          <div className="pk-bonus-cta">
            <button type="button" onClick={() => setStage('playing')}>Again</button>
            <Link href="/games">More games <ArrowRight size={13} /></Link>
          </div>
        </div>
      )}
    </section>
  );
}

const bonusStyles = `
.pk-bonus {
  margin-top: 16px; padding: 16px 18px; border-radius: 18px;
  background: #f8fafc; border: 1px solid rgba(15,23,42,0.09);
}

.pk-bonus-idle, .pk-bonus-done { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.pk-bonus-icon {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(229,9,20,0.07); border: 1px solid rgba(229,9,20,0.18);
  color: var(--accent-main);
}
.pk-bonus-icon.is-win {
  background: rgba(39,201,63,0.1); border-color: rgba(39,201,63,0.32); color: #0b8a2c;
}
.pk-bonus-text { display: flex; flex-direction: column; flex: 1; min-width: 150px; line-height: 1.4; }
.pk-bonus-text strong { font-size: 0.9rem; font-weight: 800; color: var(--text-main); }
.pk-bonus-text span { font-size: 0.78rem; color: var(--text-secondary); }

.pk-bonus-start {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0;
  padding: 10px 18px; border-radius: 30px; border: none;
  background: var(--accent-main); color: #fff; font-size: 0.85rem; font-weight: 800;
  transition: filter 0.2s ease, transform 0.2s ease;
}
.pk-bonus-start:hover { filter: brightness(1.07); transform: translateY(-1px); }

.pk-bonus-play { padding: 4px 0; }

.pk-bonus-cta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.pk-bonus-cta button, .pk-bonus-cta a {
  display: inline-flex; align-items: center; gap: 5px; cursor: pointer; text-decoration: none;
  padding: 8px 14px; border-radius: 30px;
  background: #fff; border: 1px solid rgba(15,23,42,0.12);
  font-size: 0.79rem; font-weight: 700; color: var(--text-main);
}
.pk-bonus-cta button:hover, .pk-bonus-cta a:hover {
  border-color: rgba(229,9,20,0.35); color: var(--accent-main);
}

@media (max-width: 480px) {
  .pk-bonus { padding: 14px; }
  .pk-bonus-start, .pk-bonus-cta { width: 100%; justify-content: center; }
}
`;
