"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@/components/Common/Icons';

/**
 * Page chrome shared by every game: the breadcrumb back to the hub, the title
 * block, and the one stylesheet all three games draw their classes from.
 *
 * The stylesheet lives here rather than in globals.css so that none of it is
 * downloaded by the ~99% of visitors who never open a game — the games are a
 * side door, not the main product.
 */
export default function GameShell({ eyebrow, title, accentWord, subtitle, children, hideBack = false }) {
  return (
    <main className="pk-game-page">
      <style>{gameStyles}</style>

      <div className="pk-game-wrap">
        {!hideBack && (
          <Link href="/games" className="pk-game-back">
            <ArrowLeft size={16} /> All games
          </Link>
        )}

        <header className="pk-game-head">
          {eyebrow && <span className="pk-game-eyebrow">{eyebrow}</span>}
          <h1 className="pk-game-title">
            {title} {accentWord && <span className="pk-accent">{accentWord}</span>}
          </h1>
          {subtitle && <p className="pk-game-sub">{subtitle}</p>}
        </header>

        {children}
      </div>
    </main>
  );
}

const gameStyles = `
.pk-game-page { padding: 40px var(--container-pad) 80px; min-height: 80vh; }
.pk-game-wrap { max-width: 1000px; margin: 0 auto; }

.pk-game-back {
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--text-secondary); text-decoration: none;
  font-size: 0.9rem; font-weight: 600; margin-bottom: 24px;
  padding: 8px 14px; border-radius: 30px;
  background: rgba(15,23,42,0.04); border: 1px solid rgba(15,23,42,0.08);
  transition: background 0.2s ease, color 0.2s ease;
}
.pk-game-back:hover { background: rgba(15,23,42,0.08); color: var(--text-main); }

.pk-game-head { text-align: center; margin-bottom: 36px; }
.pk-game-eyebrow {
  display: inline-block; font-size: 0.75rem; font-weight: 800;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--accent-main); margin-bottom: 12px;
}
.pk-game-title {
  font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 800;
  line-height: 1.1; letter-spacing: -1px; margin: 0 0 14px;
  color: var(--text-main);
}
.pk-accent { color: var(--accent-main); }
.pk-game-sub {
  color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6;
  max-width: 620px; margin: 0 auto;
}

/* --- Score strip ------------------------------------------------------- */
.pk-stats { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; }
.pk-stat {
  background: #f8fafc; border: 1px solid rgba(15,23,42,0.08);
  border-radius: 16px; padding: 12px 20px; min-width: 92px; text-align: center;
}
.pk-stat-value { display: block; font-size: 1.5rem; font-weight: 800; color: var(--text-main); line-height: 1.1; }
.pk-stat-label {
  display: block; font-size: 0.7rem; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: var(--text-muted); margin-top: 4px;
}

/* --- Buttons ----------------------------------------------------------- */
.pk-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 26px; border-radius: 30px; border: none; cursor: pointer;
  font-size: 0.98rem; font-weight: 700; text-decoration: none;
  background: var(--accent-main); color: #fff;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.pk-btn:hover { transform: translateY(-2px); filter: brightness(1.06); }
.pk-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.pk-btn-ghost {
  background: #fff; color: var(--text-main);
  border: 1px solid rgba(15,23,42,0.12);
}
.pk-btn-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 28px; }

/* --- Panels ------------------------------------------------------------ */
.pk-panel {
  background: #fff; border: 1px solid rgba(15,23,42,0.08);
  border-radius: 24px; padding: 28px; box-shadow: 0 10px 30px rgba(17,24,39,0.06);
}
.pk-media {
  width: 100%; aspect-ratio: 1200 / 628; border-radius: 18px;
  overflow: hidden; background: #e8eaee; position: relative;
}
.pk-media img { width: 100%; height: 100%; object-fit: cover; display: block; }

@media (max-width: 640px) {
  .pk-game-page { padding: 24px 16px 60px; }
  .pk-panel { padding: 18px; border-radius: 20px; }
  .pk-stat { padding: 10px 14px; min-width: 76px; }
  .pk-stat-value { font-size: 1.25rem; }
}
`;
