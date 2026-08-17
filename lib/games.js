// Data layer for the /games section.
//
// Every game runs on the prompt library that is already in the database — the
// images, titles and AI tags the grid renders. Nothing here needs new content,
// new tables or a login: the games are a second way to browse the same library,
// so a visitor who came to copy one prompt ends up seeing thirty.
//
// Server-safe: no client-only imports, so route components can call these
// directly. Anything that touches localStorage lives in lib/gameStorage.js.

import { fetchAllData } from '@/lib/data';

/** A prompt with no picture can't be guessed, voted on, or put on a wheel. */
const hasImage = (p) => Boolean(p.thumbnail_url || p.imgAfter || p.imgBefore);

/**
 * Titles are written for search, not for a quiz: nearly every one ends in
 * "AI Prompt" and many open with the same "Ultra-Realistic" hook. Four options
 * sharing both would make the game a reading test rather than a look-at-the-
 * picture test, so strip the boilerplate for display only — the real title is
 * still what the prompt page shows.
 */
export function gameLabel(title) {
  return String(title || '')
    .replace(/\s*\bAI\s+Prompt\b\s*$/i, '')
    .replace(/\s*\bPrompt\b\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim() || String(title || '').trim();
}

/**
 * The card fields a game round needs, and nothing else. `promptText` is ~82% of
 * the library payload and no game displays it, so it never leaves the server.
 */
function toCard(p) {
  return {
    key: p.key,
    slug: p.slug || p.key,
    title: p.title,
    label: gameLabel(p.title),
    image: p.thumbnail_url || p.imgAfter || p.imgBefore,
    aiType: p.aiType || '',
    isPremium: Boolean(p.isPremium),
  };
}

/**
 * The deck every game draws from, in a stable order.
 *
 * Stable matters: these are server components, so a shuffle here would render
 * one order on the server and a different one on the client and blow up
 * hydration. Each game shuffles in an effect after mount instead.
 */
export async function fetchGameDeck() {
  const { prompts } = await fetchAllData({ includePromptText: false });
  return prompts.filter((p) => p.title && hasImage(p)).map(toCard);
}

/**
 * Day key in UTC, so everyone in the world gets the same daily prize at the
 * same moment and the client can count down to a reset it can predict.
 */
export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Deterministic 32-bit hash — same string in, same number out, on any runtime. */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The daily spin prize.
 *
 * Chosen on the server from the date, for two reasons. It makes the prize the
 * same for every visitor — a shared "today's unlock" rather than a private
 * lottery — and it means only one PIN is ever sent to the browser. Handing the
 * page every premium password so it could pick client-side would give the whole
 * vault away and leave nothing to win tomorrow.
 */
const WHEEL_SIZE = 8;

export async function fetchDailyPrize() {
  const { prompts } = await fetchAllData({ includePromptText: false });
  const playable = prompts.filter((p) => p.title && hasImage(p));
  const premium = playable.filter((p) => p.isPremium);
  // Premium is the point of the prize, but an all-free library shouldn't break
  // the page — fall back to any prompt as a plain "prompt of the day".
  const prizePool = premium.length ? premium : playable;
  if (!prizePool.length) return { dayKey: utcDayKey(), prize: null, segments: [], prizeIndex: 0 };

  const dayKey = utcDayKey();
  const seed = hashString(`pk-spin-${dayKey}`);
  const winner = prizePool[seed % prizePool.length];

  // The wheel is laid out here rather than in the browser so the server and the
  // client render the same circle — a shuffle at render time is a hydration
  // error, and a shuffle in an effect makes the wheel pop in after paint.
  //
  // Losing segments come from the whole library, not just the prize pool: a
  // site with two premium prompts would otherwise get a two-slice wheel, which
  // looks broken and gives the outcome away before the spin finishes.
  const others = playable.filter((p) => p.key !== winner.key);
  const size = Math.min(WHEEL_SIZE, others.length + 1);
  const fillers = [];
  for (let i = 0; i < size - 1 && others.length; i++) {
    fillers.push(others.splice(hashString(`${dayKey}-${i}`) % others.length, 1)[0]);
  }

  const prizeIndex = seed % size;
  let f = 0;
  const segments = Array.from({ length: size }, (_, i) =>
    // Losing segments travel without their passwords. Sending the whole vault
    // so the page could pick a winner locally would empty it in one visit.
    i === prizeIndex ? toCard(winner) : toCard(fillers[f++])
  );

  return {
    dayKey,
    segments,
    prizeIndex,
    // The PIN is the prize, so this one prompt — and only this one — carries it.
    prize: { ...toCard(winner), pin: String(winner.password || '1234').trim() },
  };
}
