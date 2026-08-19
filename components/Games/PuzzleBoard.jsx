"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { RotateCcw, X } from '@/components/Common/Icons';
import { optimizeImage } from '@/utils/imageUtils';

const GRID = 3;
const TILES = GRID * GRID;

/**
 * A 3x3 picture puzzle cut from a prompt's own image.
 *
 * Two callers, two jobs: on a locked premium prompt it is a second way in for
 * people who don't have the PIN, and on a free prompt it is an optional bonus
 * that gates nothing. The board doesn't know which — it reports a solve and
 * lets the caller decide what that is worth.
 *
 * Tile-swap rather than the classic sliding puzzle on purpose: any permutation
 * of a swap puzzle is solvable, and it takes well under a minute. A 3x3 slider
 * has parity states and a long tail of people who give up — and someone who
 * gives up here doesn't read the prompt, doesn't copy it, and leaves.
 */
function shuffled() {
  const order = Array.from({ length: TILES }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // A shuffle that lands solved would win before the first tap.
  return order.every((v, i) => v === i) ? shuffled() : order;
}

const isSolved = (order) => order.every((v, i) => v === i);

/** Which ninth of the picture tile `n` shows. */
const tileBackground = (n) => ({
  backgroundPosition: `${((n % GRID) / (GRID - 1)) * 100}% ${(Math.floor(n / GRID) / (GRID - 1)) * 100}%`,
});

export default function PuzzleBoard({
  image,
  onSolved,
  onCancel,
  fill = false,
  cancelLabel = 'Use PIN instead',
  solvedTitle = 'Solved — unlocking…',
}) {
  const [order, setOrder] = useState(null);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  // Shuffle after mount so the server and the browser don't render two
  // different boards and fail hydration.
  useEffect(() => {
    setOrder(shuffled());
  }, []);

  const reset = useCallback(() => {
    setOrder(shuffled());
    setSelected(null);
    setMoves(0);
    setWon(false);
  }, []);

  const tap = (index) => {
    if (won || !order) return;

    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }

    const next = [...order];
    [next[selected], next[index]] = [next[index], next[selected]];
    setOrder(next);
    setSelected(null);
    setMoves((m) => m + 1);

    if (isSolved(next)) {
      setWon(true);
      // Let the last tile land and the win state paint before the caller tears
      // the board down — solving is the moment worth seeing.
      setTimeout(() => onSolved?.(moves + 1), 620);
    }
  };

  const src = optimizeImage(image, 600);

  return (
    <div className={`pk-puzzle ${fill ? 'is-fill' : ''}`}>
      <style>{puzzleStyles}</style>

      <div className="pk-puzzle-top">
        <span className="pk-puzzle-ref" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
        <span className="pk-puzzle-copy">
          <strong>{won ? solvedTitle : 'Rebuild the picture'}</strong>
          <span>{won ? `In ${moves} moves` : 'Tap two tiles to swap them'}</span>
        </span>
        <span className="pk-puzzle-moves">{moves}</span>
      </div>

      <div className="pk-puzzle-stage">
        <div className={`pk-puzzle-grid ${won ? 'is-won' : ''}`} role="group" aria-label="Picture puzzle">
          {(order || Array.from({ length: TILES }, (_, i) => i)).map((tile, slot) => (
            <button
              key={slot}
              type="button"
              className={`pk-tile ${selected === slot ? 'is-picked' : ''} ${won ? 'is-done' : ''}`}
              style={{ backgroundImage: `url(${src})`, ...tileBackground(tile) }}
              onClick={() => tap(slot)}
              disabled={won || !order}
              aria-label={`Puzzle tile ${slot + 1}`}
            />
          ))}
        </div>
      </div>

      {!won && (
        <div className="pk-puzzle-actions">
          <button type="button" onClick={reset}>
            <RotateCcw size={13} /> Shuffle
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel}>
              <X size={13} /> {cancelLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const puzzleStyles = `
.pk-puzzle { width: 100%; max-width: 212px; margin: 0 auto; }

.pk-puzzle-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.pk-puzzle-ref {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  background-size: cover; background-position: center;
  border: 1.5px solid rgba(0,0,0,0.12);
}
.pk-puzzle-copy { display: flex; flex-direction: column; flex: 1; min-width: 0; line-height: 1.35; }
.pk-puzzle-copy strong { font-size: 0.78rem; font-weight: 800; color: #2d2d2d; }
.pk-puzzle-copy span { font-size: 0.68rem; color: rgba(0,0,0,0.45); }
.pk-puzzle-moves {
  font-size: 0.9rem; font-weight: 800; color: rgba(0,0,0,0.35);
  font-variant-numeric: tabular-nums; flex-shrink: 0;
}

.pk-puzzle-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;
  padding: 5px; border-radius: 14px;
  background: rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.1);
  transition: box-shadow 0.35s ease, border-color 0.35s ease;
}
.pk-puzzle-grid.is-won {
  gap: 0; border-color: #27C93F;
  box-shadow: 0 0 0 3px rgba(39,201,63,0.2), 0 10px 28px rgba(39,201,63,0.22);
}

.pk-tile {
  aspect-ratio: 1 / 1; width: 100%; padding: 0; cursor: pointer;
  border: 2px solid transparent; border-radius: 8px;
  background-size: 300% 300%; background-repeat: no-repeat;
  background-color: rgba(0,0,0,0.08);
  transition: transform 0.16s ease, border-color 0.16s ease, border-radius 0.35s ease;
}
.pk-tile:hover:not(:disabled) { border-color: rgba(229,9,20,0.5); }
.pk-tile.is-picked {
  border-color: var(--accent-main);
  transform: scale(0.92);
  box-shadow: 0 0 0 3px rgba(229,9,20,0.18);
}
.pk-tile.is-done { border-radius: 0; border-color: transparent; cursor: default; }

.pk-puzzle-actions { display: flex; justify-content: center; gap: 6px; margin-top: 10px; }
.pk-puzzle-actions button {
  display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
  padding: 6px 11px; border-radius: 9px;
  background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1);
  font-size: 0.71rem; font-weight: 700; color: rgba(0,0,0,0.5);
  transition: background 0.2s ease, color 0.2s ease;
}
.pk-puzzle-actions button:hover { background: rgba(0,0,0,0.09); color: #333; }

@media (max-width: 560px) {
  .pk-puzzle:not(.is-fill) { max-width: 194px; }
}

/* Fill mode: the board is the panel, not an object floating in it.
   The grid stays square and is sized by whichever of the two axes runs out
   first, so the tiles never distort and the bottom row never gets clipped. */
.pk-puzzle.is-fill {
  max-width: none; width: 100%; height: 100%;
  display: flex; flex-direction: column; min-height: 0;
}
/* The stage is inert unless the board is filling, so the compact layout is
   unchanged. When filling it becomes a size container, which is what lets the
   board be min(width, height) — the one thing plain flex + aspect-ratio can't
   express, and the reason the board came out 290x315 without it. */
.pk-puzzle-stage { display: contents; }
.pk-puzzle.is-fill .pk-puzzle-stage {
  display: flex; flex: 1 1 auto; min-height: 0; min-width: 0;
  container-type: size;
}
.pk-puzzle.is-fill .pk-puzzle-grid {
  width: min(100%, 100cqh); height: auto;
  aspect-ratio: 1 / 1; margin: auto;
  grid-template-rows: repeat(3, 1fr);
  gap: 6px; padding: 7px; border-radius: 18px;
}
.pk-puzzle.is-fill .pk-puzzle-grid.is-won { gap: 0; }
.pk-puzzle.is-fill .pk-tile { aspect-ratio: auto; height: 100%; border-radius: 11px; }
.pk-puzzle.is-fill .pk-tile.is-done { border-radius: 0; }
.pk-puzzle.is-fill .pk-puzzle-top { flex-shrink: 0; }
.pk-puzzle.is-fill .pk-puzzle-actions { flex-shrink: 0; }
`;
