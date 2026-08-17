"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import GameShell from '@/components/Games/GameShell';
import { Check, X, Clock, Zap, ArrowRight, Award } from '@/components/Common/Icons';
import { GAME_KEYS, readGame, writeBest, writeGame } from '@/lib/gameStorage';
import { optimizeImage } from '@/utils/imageUtils';

const ROUNDS = 10;
const SECONDS = 15;
const MIN_DECK = 4; // one answer plus three decoys

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Decoys are matched on label, not key: the library contains near-duplicate
 * titles ("Independence Day Tricolor Portrait" twice under different keys), and
 * offering two options that read identically makes a correct answer impossible.
 */
function buildQuestions(deck) {
  const questions = [];
  for (const card of shuffle(deck)) {
    if (questions.length >= ROUNDS) break;
    const decoys = shuffle(deck.filter((c) => c.key !== card.key && c.label !== card.label)).slice(0, 3);
    if (decoys.length < 3) continue;
    questions.push({ card, options: shuffle([card, ...decoys]) });
  }
  return questions;
}

export default function ClientGuessGame({ deck = [] }) {
  const playable = useMemo(() => deck.filter((c) => c.image && c.label), [deck]);

  const [questions, setQuestions] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(0);

  // The clock and a tap can both land an answer in the same frame. `answered`
  // is state, so it hasn't updated yet when the second one arrives — this ref
  // is what actually stops a question being scored twice.
  const answeredRef = useRef(false);

  const start = useCallback(() => {
    setQuestions(buildQuestions(playable));
    setIdx(0);
    answeredRef.current = false;
    setAnswered(false);
    setPicked(null);
    setTimeLeft(SECONDS);
    setScore(0);
    setStreak(0);
    setHistory([]);
    setFinished(false);
  }, [playable]);

  // The deck arrives from the server in a fixed order and the shuffle happens
  // here, after mount — shuffling during render would give the server one
  // question order and the browser another, and hydration would throw.
  useEffect(() => {
    setBest(Number(readGame(GAME_KEYS.quizBest, 0)) || 0);
    start();
  }, [start]);

  const question = questions?.[idx];

  const answer = useCallback((key) => {
    if (answeredRef.current || !question) return;
    answeredRef.current = true;

    const correct = key === question.card.key;
    setAnswered(true);
    setPicked(key);
    setHistory((h) => [...h, { card: question.card, correct }]);

    if (correct) {
      // Speed and streak are where the points are: a slow, safe answer is
      // worth a fraction of a fast one, which is what keeps rounds short.
      setScore((s) => s + 100 + timeLeft * 10 + streak * 25);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }, [question, timeLeft, streak]);

  // Countdown. Running out is a wrong answer, not a skip — otherwise waiting is
  // strictly better than guessing.
  useEffect(() => {
    if (!question || answered || finished) return;
    if (timeLeft <= 0) {
      answer(null);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [question, answered, finished, timeLeft, answer]);

  // Fetch the next picture while the player is reading the current result, so
  // "Next" never lands on an empty frame.
  useEffect(() => {
    const upcoming = questions?.[idx + 1];
    if (!upcoming?.card?.image) return;
    const img = new window.Image();
    img.src = optimizeImage(upcoming.card.image, 900);
  }, [questions, idx]);

  useEffect(() => {
    if (!finished) return;
    setBest(writeBest(GAME_KEYS.quizBest, score));
    writeGame(GAME_KEYS.quizRounds, (Number(readGame(GAME_KEYS.quizRounds, 0)) || 0) + 1);
  }, [finished, score]);

  const next = () => {
    if (idx + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIdx(idx + 1);
    answeredRef.current = false;
    setAnswered(false);
    setPicked(null);
    setTimeLeft(SECONDS);
  };

  const shell = {
    eyebrow: 'Game 1',
    title: 'Guess the',
    accentWord: 'Prompt',
    subtitle: 'We show the picture. You pick which of the four prompts made it. Answer fast — the clock is worth more than the answer.',
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

  if (finished) {
    const correct = history.filter((h) => h.correct).length;
    return (
      <GameShell {...shell}>
        <style>{quizStyles}</style>
        <div className="pk-panel pk-result">
          <span className="pk-result-icon"><Award size={30} /></span>
          <h2 className="pk-result-score">{score.toLocaleString()}</h2>
          <p className="pk-result-line">
            {correct} of {history.length} correct
            {score >= best && score > 0 ? ' — new personal best!' : ` · your best is ${best.toLocaleString()}`}
          </p>

          <div className="pk-btn-row">
            <button type="button" className="pk-btn" onClick={start}>Play again</button>
            <Link href="/games" className="pk-btn pk-btn-ghost">More games</Link>
          </div>

          {/* The actual payoff: ten prompts the player just looked at closely,
              each one click from the page that lets them copy it. */}
          <h3 className="pk-recap-h">The prompts you just played</h3>
          <div className="pk-recap">
            {history.map(({ card, correct: wasRight }, i) => (
              <Link key={`${card.key}-${i}`} href={`/prompt/${card.slug}`} className="pk-recap-row">
                <img src={optimizeImage(card.image, 120)} alt="" loading="lazy" decoding="async" />
                <span className="pk-recap-title">{card.label}</span>
                <span className={`pk-recap-mark ${wasRight ? 'is-right' : 'is-wrong'}`}>
                  {wasRight ? <Check size={14} /> : <X size={14} />}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </GameShell>
    );
  }

  if (!question) {
    return (
      <GameShell {...shell}>
        <div className="pk-panel" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Shuffling the deck…
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell {...shell}>
      <style>{quizStyles}</style>

      <div className="pk-stats">
        <div className="pk-stat">
          <span className="pk-stat-value">{idx + 1}/{questions.length}</span>
          <span className="pk-stat-label">Round</span>
        </div>
        <div className="pk-stat">
          <span className="pk-stat-value">{score.toLocaleString()}</span>
          <span className="pk-stat-label">Score</span>
        </div>
        <div className="pk-stat">
          <span className="pk-stat-value">{streak}</span>
          <span className="pk-stat-label">Streak</span>
        </div>
      </div>

      <div className="pk-panel">
        <div className="pk-media">
          <img
            key={question.card.key}
            src={optimizeImage(question.card.image, 900)}
            alt="Which prompt produced this image?"
            decoding="async"
          />
          <div className={`pk-timer ${timeLeft <= 5 ? 'is-low' : ''}`}>
            <Clock size={14} /> {answered ? '—' : `${timeLeft}s`}
          </div>
          {streak >= 2 && !answered && (
            <div className="pk-streak"><Zap size={13} /> {streak} in a row</div>
          )}
        </div>

        <div className="pk-timerbar" aria-hidden="true">
          <span style={{ width: `${answered ? 0 : (timeLeft / SECONDS) * 100}%` }} />
        </div>

        <div className="pk-options">
          {question.options.map((opt) => {
            const isCorrect = opt.key === question.card.key;
            const isPicked = opt.key === picked;
            const state = !answered ? '' : isCorrect ? 'is-correct' : isPicked ? 'is-wrong' : 'is-dim';
            return (
              <button
                key={opt.key}
                type="button"
                className={`pk-option ${state}`}
                onClick={() => answer(opt.key)}
                disabled={answered}
              >
                <span>{opt.label}</span>
                {answered && isCorrect && <Check size={17} />}
                {answered && isPicked && !isCorrect && <X size={17} />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="pk-after">
            <p className="pk-after-line">
              {picked === question.card.key
                ? 'Correct.'
                : picked === null
                  ? 'Out of time.'
                  : 'Not that one.'}{' '}
              This is <strong>{question.card.title}</strong>.
            </p>
            <div className="pk-btn-row" style={{ marginTop: '16px' }}>
              <button type="button" className="pk-btn" onClick={next}>
                {idx + 1 >= questions.length ? 'See your score' : 'Next round'} <ArrowRight size={16} />
              </button>
              <Link href={`/prompt/${question.card.slug}`} className="pk-btn pk-btn-ghost">
                Open this prompt
              </Link>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}

const quizStyles = `
.pk-timer {
  position: absolute; top: 12px; right: 12px;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 13px; border-radius: 30px;
  background: rgba(0,0,0,0.62); color: #fff;
  font-size: 0.82rem; font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.pk-timer.is-low { background: var(--accent-main); }
.pk-streak {
  position: absolute; top: 12px; left: 12px;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: 30px;
  background: rgba(0,0,0,0.62); color: #ffd166;
  font-size: 0.74rem; font-weight: 800;
}

.pk-timerbar { height: 4px; border-radius: 4px; background: rgba(15,23,42,0.08); margin: 14px 0 20px; overflow: hidden; }
.pk-timerbar span { display: block; height: 100%; background: var(--accent-main); transition: width 1s linear; }

.pk-options { display: grid; gap: 10px; }
.pk-option {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  width: 100%; text-align: left; cursor: pointer;
  padding: 15px 18px; border-radius: 15px;
  background: #f8fafc; border: 1.5px solid rgba(15,23,42,0.08);
  font-size: 0.95rem; font-weight: 600; line-height: 1.4; color: var(--text-main);
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}
.pk-option:hover:not(:disabled) { background: #fff; border-color: rgba(229,9,20,0.35); transform: translateX(3px); }
.pk-option:disabled { cursor: default; }
.pk-option.is-correct { background: rgba(15,157,118,0.1); border-color: #0f9d76; color: #0b6b51; }
.pk-option.is-wrong { background: rgba(229,9,20,0.08); border-color: var(--accent-main); color: #a30810; }
.pk-option.is-dim { opacity: 0.45; }

.pk-after { margin-top: 22px; padding-top: 20px; border-top: 1px solid rgba(15,23,42,0.07); text-align: center; }
.pk-after-line { margin: 0; font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); }
.pk-after-line strong { color: var(--text-main); }

.pk-result { text-align: center; }
.pk-result-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 62px; height: 62px; border-radius: 20px; margin-bottom: 14px;
  background: rgba(229,9,20,0.08); border: 1px solid rgba(229,9,20,0.2);
  color: var(--accent-main);
}
.pk-result-score { font-size: 3.2rem; font-weight: 800; margin: 0; line-height: 1; color: var(--text-main); }
.pk-result-line { margin: 10px 0 0; color: var(--text-secondary); font-size: 0.98rem; }

.pk-recap-h {
  font-size: 0.78rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: var(--text-muted); margin: 40px 0 14px; text-align: left;
}
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
  flex: 1; text-align: left; font-size: 0.88rem; font-weight: 600; color: var(--text-main);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pk-recap-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; color: #fff;
}
.pk-recap-mark.is-right { background: #0f9d76; }
.pk-recap-mark.is-wrong { background: var(--accent-main); }

@media (max-width: 640px) {
  .pk-option { padding: 13px 15px; font-size: 0.88rem; }
  .pk-result-score { font-size: 2.6rem; }
}
`;
