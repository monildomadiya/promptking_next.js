"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import GameShell from '@/components/Games/GameShell';
import { Crown, Lock, Unlock, Clock, Copy, Check, ArrowRight } from '@/components/Common/Icons';
import { GAME_KEYS, readGame, writeGame } from '@/lib/gameStorage';
import { optimizeImage } from '@/utils/imageUtils';

const SPIN_MS = 4200;
const FULL_TURNS = 6;

/** ms until the next UTC midnight — the same instant the server picks a new prize. */
function msUntilReset() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(0, next - now.getTime());
}

function formatCountdown(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function ClientSpinGame({ dayKey, segments = [], prizeIndex = 0, prize }) {
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [copied, setCopied] = useState(false);
  // Until the effect below has read localStorage we don't know whether today's
  // spin is already used, and guessing either way flashes the wrong screen.
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);

  const segmentAngle = segments.length ? 360 / segments.length : 0;

  // The slices are painted as one conic-gradient rather than N rotated,
  // skewed divs: a CSS pie wedge only works for 90°-and-under slices, and the
  // wheel has to survive any segment count the library happens to allow.
  const wheelFace = segments.length
    ? `conic-gradient(${segments
        .map((_, i) => {
          const tint = i % 2 ? 'rgba(15,23,42,0.06)' : 'rgba(229,9,20,0.10)';
          return `${tint} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`;
        })
        .join(', ')})`
    : 'none';

  useEffect(() => {
    const saved = readGame(GAME_KEYS.spinDay, null);
    if (saved?.dayKey === dayKey) {
      setRevealed(true);
      // Park the wheel on the prize rather than replaying the animation: this
      // is a return visit, and the result is already decided.
      setRotation(-(prizeIndex * segmentAngle + segmentAngle / 2));
    }
    setReady(true);
  }, [dayKey, prizeIndex, segmentAngle]);

  useEffect(() => {
    if (!revealed) return;
    const tick = () => setCountdown(msUntilReset());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [revealed]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const spin = useCallback(() => {
    if (spinning || revealed || !prize) return;
    setSpinning(true);

    // The pointer sits at the top, so landing segment `prizeIndex` means
    // rotating its centre back up to 0° — plus whole turns for the show.
    const target = FULL_TURNS * 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    setRotation(target);

    timerRef.current = setTimeout(() => {
      setSpinning(false);
      setRevealed(true);
      writeGame(GAME_KEYS.spinDay, { dayKey, key: prize.key });
    }, SPIN_MS);
  }, [spinning, revealed, prize, prizeIndex, segmentAngle, dayKey]);

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(prize.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (insecure origin, permissions). The PIN is on screen
      // in large type anyway — nothing to recover from.
    }
  };

  const shell = {
    eyebrow: 'Game 3',
    title: 'Daily',
    accentWord: 'Spin',
    subtitle: 'One spin every 24 hours. Whatever the wheel lands on, that prompt’s unlock PIN is yours for the rest of the day.',
  };

  if (!prize) {
    return (
      <GameShell {...shell}>
        <div className="pk-panel" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            No prompts are available to put on the wheel right now.
          </p>
          <Link href="/" className="pk-btn">Browse prompts</Link>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell {...shell}>
      <style>{spinStyles}</style>

      <div className="pk-spin-stage">
        <div className="pk-wheel-wrap">
          <span className="pk-pointer" aria-hidden="true" />
          <div
            className="pk-wheel"
            style={{
              background: wheelFace,
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.9, 0.15, 1)` : 'none',
            }}
          >
            {segments.map((card, i) => {
              const centre = i * segmentAngle + segmentAngle / 2;
              return (
                <span
                  key={`${card.key}-${i}`}
                  className="pk-seg-face"
                  // Out along the slice's centre line, then rotated back so the
                  // picture sits upright instead of tipping with its slice.
                  // The radius is a CSS variable so the media query can shrink
                  // it without this inline transform overriding the change.
                  style={{ transform: `rotate(${centre}deg) translateY(var(--pk-r)) rotate(${-centre}deg)` }}
                >
                  <img src={optimizeImage(card.image, 120)} alt="" loading="lazy" decoding="async" />
                </span>
              );
            })}
            <span className="pk-wheel-hub" aria-hidden="true"><Crown size={20} fill="#ffd166" /></span>
          </div>
        </div>

        {!ready ? (
          <p className="pk-spin-note">Checking today&apos;s spin…</p>
        ) : !revealed ? (
          <>
            <button type="button" className="pk-btn pk-spin-btn" onClick={spin} disabled={spinning}>
              {spinning ? 'Spinning…' : 'Spin the wheel'}
            </button>
            <p className="pk-spin-note">
              <Lock size={13} /> {segments.length} prompts on the wheel · one spin per day
            </p>
          </>
        ) : (
          <div className="pk-prize">
            <span className="pk-prize-badge"><Unlock size={13} /> Unlocked today</span>

            <Link href={`/prompt/${prize.slug}`} className="pk-prize-card">
              <span className="pk-media">
                <img src={optimizeImage(prize.image, 700)} alt={prize.title} decoding="async" />
              </span>
              <span className="pk-prize-title">{prize.title}</span>
            </Link>

            <div className="pk-pin-box">
              <span className="pk-pin-label">Unlock PIN</span>
              <span className="pk-pin-value">{prize.pin}</span>
              <button type="button" className="pk-pin-copy" onClick={copyPin}>
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>

            <div className="pk-btn-row">
              <Link href={`/prompt/${prize.slug}`} className="pk-btn">
                Open the prompt <ArrowRight size={16} />
              </Link>
              <Link href="/games" className="pk-btn pk-btn-ghost">More games</Link>
            </div>

            <p className="pk-spin-note">
              <Clock size={13} /> Next spin in {countdown === null ? '—' : formatCountdown(countdown)}
            </p>
          </div>
        )}
      </div>

      <nav className="pk-spin-out" aria-label="Browse prompts">
        <Link href="/">All prompts</Link>
        <Link href="/categories">Categories</Link>
        <Link href="/faq">How unlocking works</Link>
      </nav>
    </GameShell>
  );
}

const spinStyles = `
.pk-spin-stage { display: flex; flex-direction: column; align-items: center; gap: 22px; }

.pk-wheel-wrap { position: relative; width: 300px; height: 300px; --pk-r: -98px; }
.pk-pointer {
  position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
  width: 0; height: 0; z-index: 3;
  border-left: 13px solid transparent; border-right: 13px solid transparent;
  border-top: 22px solid var(--accent-main);
  filter: drop-shadow(0 3px 5px rgba(15,23,42,0.3));
}
.pk-wheel {
  position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
  background: #f1f5f9;
  border: 6px solid #fff;
  box-shadow: 0 0 0 3px rgba(15,23,42,0.1), 0 18px 44px rgba(15,23,42,0.18);
}
.pk-seg-face {
  position: absolute; top: 50%; left: 50%;
  display: block; width: 46px; height: 46px; margin: -23px 0 0 -23px;
  border-radius: 12px; overflow: hidden;
  border: 2px solid #fff; box-shadow: 0 4px 10px rgba(15,23,42,0.2);
}
.pk-seg-face img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pk-wheel-hub {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 56px; height: 56px; border-radius: 50%; z-index: 2;
  display: flex; align-items: center; justify-content: center;
  background: var(--text-main); border: 4px solid #fff;
  box-shadow: 0 6px 16px rgba(15,23,42,0.3);
}

.pk-spin-btn { padding: 16px 40px; font-size: 1.05rem; }
.pk-spin-note {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 0.84rem; color: var(--text-muted); margin: 0;
  font-variant-numeric: tabular-nums;
}

.pk-prize { width: 100%; max-width: 460px; text-align: center; }
.pk-prize-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 15px; border-radius: 30px; margin-bottom: 16px;
  background: rgba(15,157,118,0.1); border: 1px solid rgba(15,157,118,0.3);
  color: #0b6b51; font-size: 0.74rem; font-weight: 800;
  letter-spacing: 0.8px; text-transform: uppercase;
}
.pk-prize-card {
  display: block; text-decoration: none;
  background: #fff; border: 1px solid rgba(15,23,42,0.08);
  border-radius: 20px; padding: 12px; box-shadow: 0 10px 28px rgba(17,24,39,0.08);
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.pk-prize-card:hover { border-color: rgba(229,9,20,0.32); transform: translateY(-3px); }
.pk-prize-title {
  display: block; margin-top: 12px; padding: 0 4px 4px;
  font-size: 0.98rem; font-weight: 700; line-height: 1.4; color: var(--text-main);
}

.pk-pin-box {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  margin-top: 18px; padding: 16px 20px; border-radius: 18px;
  background: #f8fafc; border: 1.5px dashed rgba(229,9,20,0.35);
}
.pk-pin-label {
  font-size: 0.68rem; font-weight: 800; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--text-muted);
}
.pk-pin-value {
  font-size: 1.7rem; font-weight: 800; letter-spacing: 4px;
  color: var(--accent-main); font-variant-numeric: tabular-nums;
}
.pk-pin-copy {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 8px 14px; border-radius: 30px;
  background: #fff; border: 1px solid rgba(15,23,42,0.12);
  font-size: 0.8rem; font-weight: 700; color: var(--text-main);
}
.pk-pin-copy:hover { border-color: rgba(229,9,20,0.35); color: var(--accent-main); }

.pk-spin-out {
  display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
  margin-top: 48px; padding-top: 28px; border-top: 1px solid rgba(15,23,42,0.07);
}
.pk-spin-out a {
  padding: 9px 16px; border-radius: 50px; font-size: 0.82rem; font-weight: 700;
  background: rgba(15,23,42,0.04); border: 1px solid rgba(15,23,42,0.08);
  color: var(--text-secondary); text-decoration: none;
}
.pk-spin-out a:hover { background: rgba(15,23,42,0.08); color: var(--text-main); }

@media (max-width: 560px) {
  .pk-wheel-wrap { width: 260px; height: 260px; --pk-r: -84px; }
  .pk-seg-face { width: 40px; height: 40px; margin: -20px 0 0 -20px; }
  .pk-pin-box { flex-wrap: wrap; gap: 10px; }
  .pk-pin-value { font-size: 1.45rem; }
}
`;
