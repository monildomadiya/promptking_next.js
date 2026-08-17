"use client";

// Scores live in the visitor's own browser. No account, no scoreboard table, no
// moderation problem — and a first-time player can start a round in one tap,
// which is the whole reason the games are here.
//
// Every read is guarded: localStorage throws in private mode on some browsers,
// and a corrupt entry from an older build shouldn't take the page down with it.

const PREFIX = 'pk_game_';

export const GAME_KEYS = {
  quizBest: `${PREFIX}quiz_best`,
  quizRounds: `${PREFIX}quiz_rounds`,
  battleVotes: `${PREFIX}battle_votes`,
  battleBestStreak: `${PREFIX}battle_streak`,
  spinDay: `${PREFIX}spin_day`,
  puzzlesSolved: `${PREFIX}puzzles_solved`,
  // Fewest moves, so unlike every other record here a *lower* number wins —
  // writeBest() would keep the worst run.
  puzzleFewestMoves: `${PREFIX}puzzle_moves`,
};

export function readGame(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeGame(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode. The game is still playable, it just won't
    // remember — never worth interrupting the round over.
  }
}

/** Keep `value` only if it beats what's stored. Returns the value now stored. */
export function writeBest(key, value) {
  const current = Number(readGame(key, 0)) || 0;
  if (value > current) {
    writeGame(key, value);
    return value;
  }
  return current;
}

/**
 * Record a solved picture puzzle. Returns the running totals so the caller can
 * show them without a second read.
 */
export function recordPuzzleSolve(moves) {
  const solved = (Number(readGame(GAME_KEYS.puzzlesSolved, 0)) || 0) + 1;
  writeGame(GAME_KEYS.puzzlesSolved, solved);

  const previous = Number(readGame(GAME_KEYS.puzzleFewestMoves, 0)) || 0;
  const fewest = previous > 0 ? Math.min(previous, moves) : moves;
  writeGame(GAME_KEYS.puzzleFewestMoves, fewest);

  return { solved, fewest };
}

/**
 * Vote tally for Prompt Battle, capped.
 *
 * Without the cap this map grows one entry per prompt ever shown and is
 * re-serialised on every single tap — the one action the game asks people to
 * repeat hundreds of times.
 */
const MAX_TRACKED = 60;

export function recordBattleVote(card) {
  const votes = readGame(GAME_KEYS.battleVotes, {}) || {};
  const existing = votes[card.key];
  votes[card.key] = {
    wins: (existing?.wins || 0) + 1,
    slug: card.slug,
    label: card.label,
    image: card.image,
  };

  const entries = Object.entries(votes);
  if (entries.length > MAX_TRACKED) {
    entries.sort((a, b) => b[1].wins - a[1].wins);
    const trimmed = Object.fromEntries(entries.slice(0, MAX_TRACKED));
    writeGame(GAME_KEYS.battleVotes, trimmed);
    return trimmed;
  }

  writeGame(GAME_KEYS.battleVotes, votes);
  return votes;
}

export function readBattleTop(limit = 5) {
  const votes = readGame(GAME_KEYS.battleVotes, {}) || {};
  return Object.entries(votes)
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, limit);
}
