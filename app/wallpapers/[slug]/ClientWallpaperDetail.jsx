"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Smartphone, Monitor, Image as ImageIcon, ArrowLeft, Check } from '@/components/Common/Icons';
import { buildDownloadUrl, cropUrl, cropSrcSet, DOWNLOAD_SIZES } from '@/lib/wallpaperUrls';
import WallpaperImage from '@/components/Wallpapers/WallpaperImage';
import api from '@/lib/api';

const SIZE_ORDER = [
  { id: 'phone', Icon: Smartphone },
  { id: 'desktop', Icon: Monitor },
  { id: 'original', Icon: ImageIcon },
];

export default function ClientWallpaperDetail({ wallpaper, more = [] }) {
  const [taken, setTaken] = useState(null);

  // Cloudinary sets Content-Disposition, so the browser saves the file instead
  // of navigating away — which is why this can be a plain link and why the
  // page the visitor came for is still under them afterwards.
  const download = (size) => {
    setTaken(size);
    // Fire-and-forget: the download is already happening at the CDN and must
    // not wait on, or be cancelled by, our own analytics call.
    api.post('/record_download', { slug: wallpaper.slug }).catch(() => {});
    window.setTimeout(() => setTaken(null), 2200);
  };

  const sizes = SIZE_ORDER.map(({ id, Icon }) => ({
    id,
    Icon,
    ...DOWNLOAD_SIZES[id],
    href: buildDownloadUrl(wallpaper.image, { size: id, slug: wallpaper.slug }),
  }));

  // Non-Cloudinary sources can't be force-downloaded cross-origin. Rather than
  // render buttons that quietly do nothing, fall back to opening the file.
  const canForceDownload = sizes.every((s) => s.href);

  return (
    <main className="pk-wpd">
      <style>{styles}</style>

      <Link href="/wallpapers" className="pk-wpd-back">
        <ArrowLeft size={15} /> All wallpapers
      </Link>

      <div className="pk-wpd-layout">
        <figure className="pk-wpd-stage">
          {/* Uncropped and at `good` rather than `eco`: on this page the
              image is the thing being judged, not a link target. It is also
              the LCP element, so it loads eagerly with a srcset that lets a
              phone take the 640 instead of a desktop-sized file. */}
          <picture>
            <source
              type="image/avif"
              srcSet={cropSrcSet(wallpaper.image, [480, 640, 900, 1200, 1600], { ratio: null, quality: 'good', format: 'avif' })}
              sizes="(max-width: 900px) 94vw, 52vw"
            />
            <img
              src={cropUrl(wallpaper.image, { width: 900, ratio: null, quality: 'good' })}
              srcSet={cropSrcSet(wallpaper.image, [480, 640, 900, 1200, 1600], { ratio: null, quality: 'good' })}
              sizes="(max-width: 900px) 94vw, 52vw"
              alt={wallpaper.title}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </figure>

        <div className="pk-wpd-panel">
          <h1>{wallpaper.title}</h1>

          {wallpaper.description && <p className="pk-wpd-desc">{wallpaper.description}</p>}

          <div className="pk-wpd-meta">
            {wallpaper.width && wallpaper.height && (
              <span>{wallpaper.width} × {wallpaper.height}</span>
            )}
            {wallpaper.downloadCount > 0 && (
              <span>{wallpaper.downloadCount.toLocaleString()} downloads</span>
            )}
            <span className="pk-wpd-free">Free · no sign-up</span>
          </div>

          <div className="pk-wpd-actions">
            <span className="pk-wpd-label">Download</span>
            {sizes.map(({ id, Icon, label, hint, href }) => (
              <a
                key={id}
                className={`pk-wpd-btn ${id === 'phone' ? 'is-primary' : ''} ${taken === id ? 'is-done' : ''}`}
                href={href || wallpaper.image}
                // `download` is advisory here — Cloudinary's header is what
                // actually forces the save — but it keeps the intent obvious
                // and covers the same-origin case.
                download={canForceDownload ? '' : undefined}
                target={canForceDownload ? undefined : '_blank'}
                rel={canForceDownload ? undefined : 'noopener noreferrer'}
                onClick={() => download(id)}
              >
                {taken === id ? <Check size={16} /> : <Icon size={16} />}
                <span className="pk-wpd-btn-text">
                  <strong>{taken === id ? 'Saved' : label}</strong>
                  <small>{hint}</small>
                </span>
                {taken !== id && <Download size={15} className="pk-wpd-btn-dl" />}
              </a>
            ))}
          </div>

          {wallpaper.tags.length > 0 && (
            <div className="pk-wpd-tags">
              {wallpaper.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}

          {wallpaper.promptKey && (
            <Link href={`/prompt/${wallpaper.promptKey}`} className="pk-wpd-prompt">
              See the prompt that made this
            </Link>
          )}
        </div>
      </div>

      {more.length > 0 && (
        <section className="pk-wpd-more">
          <h2>More wallpapers</h2>
          <div className="pk-wpd-more-grid">
            {more.map((w) => (
              <Link key={w.slug} href={`/wallpapers/${w.slug}`}>
                <WallpaperImage
                  image={w.image}
                  alt={w.title}
                  widths={[150, 300, 450]}
                  sizes="(max-width: 560px) 45vw, 160px"
                />
                <span>{w.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

const styles = `
.pk-wpd { max-width: var(--container-max); width: 100%; margin: 0 auto; padding: 28px 20px 70px; }

.pk-wpd-back {
  display: inline-flex; align-items: center; gap: 7px; margin-bottom: 20px;
  font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); text-decoration: none;
}
.pk-wpd-back:hover { color: var(--accent-main); }

.pk-wpd-layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 34px; align-items: start; }

.pk-wpd-stage {
  margin: 0; border-radius: 22px; overflow: hidden;
  background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.09);
  box-shadow: 0 12px 40px rgba(0,0,0,0.08);
}
.pk-wpd-stage picture { display: contents; }
.pk-wpd-stage img { width: 100%; height: auto; display: block; }

.pk-wpd-panel { display: flex; flex-direction: column; gap: 15px; }
.pk-wpd-panel h1 {
  margin: 0; font-size: clamp(1.4rem, 3.4vw, 2rem);
  font-weight: 900; letter-spacing: -0.6px; line-height: 1.25; color: var(--text-main);
}
.pk-wpd-desc { margin: 0; font-size: 0.92rem; line-height: 1.65; color: var(--text-secondary); }

.pk-wpd-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.75rem; color: var(--text-secondary); }
.pk-wpd-meta span {
  padding: 5px 11px; border-radius: 30px;
  background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);
}
.pk-wpd-meta .pk-wpd-free {
  background: rgba(39,201,63,0.1); border-color: rgba(39,201,63,0.3); color: #0b8a2c; font-weight: 700;
}

.pk-wpd-actions { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; }
.pk-wpd-label {
  font-size: 0.7rem; font-weight: 800; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--text-secondary);
}

.pk-wpd-btn {
  display: flex; align-items: center; gap: 12px; text-decoration: none; cursor: pointer;
  padding: 13px 17px; border-radius: 15px;
  background: var(--surface-1, #fff); border: 1px solid rgba(0,0,0,0.12);
  color: var(--text-main);
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}
.pk-wpd-btn:hover { border-color: rgba(229,9,20,0.45); transform: translateY(-1px); }
.pk-wpd-btn.is-primary { background: var(--accent-main); border-color: var(--accent-main); color: #fff; }
.pk-wpd-btn.is-primary:hover { filter: brightness(1.07); }
.pk-wpd-btn.is-done { background: #0b8a2c; border-color: #0b8a2c; color: #fff; }

.pk-wpd-btn-text { display: flex; flex-direction: column; flex: 1; line-height: 1.3; }
.pk-wpd-btn-text strong { font-size: 0.88rem; font-weight: 800; }
.pk-wpd-btn-text small { font-size: 0.72rem; opacity: 0.75; }
.pk-wpd-btn-dl { opacity: 0.5; flex-shrink: 0; }

.pk-wpd-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.pk-wpd-tags span {
  padding: 4px 10px; border-radius: 30px; font-size: 0.72rem;
  background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08); color: var(--text-secondary);
}

.pk-wpd-prompt {
  align-self: flex-start; font-size: 0.82rem; font-weight: 700;
  color: var(--accent-main); text-decoration: underline; text-underline-offset: 3px;
}

.pk-wpd-more { margin-top: 52px; }
.pk-wpd-more h2 { margin: 0 0 16px; font-size: 1.1rem; font-weight: 800; color: var(--text-main); }
.pk-wpd-more-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
.pk-wpd-more-grid a { text-decoration: none; display: flex; flex-direction: column; gap: 7px; }
.pk-wpd-more-grid picture { display: contents; }
.pk-wpd-more-grid img {
  width: 100%; aspect-ratio: 3 / 4; object-fit: cover; display: block;
  border-radius: 14px; border: 1px solid rgba(0,0,0,0.08);
}
.pk-wpd-more-grid span {
  font-size: 0.8rem; font-weight: 700; color: var(--text-main);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

@media (max-width: 900px) {
  .pk-wpd-layout { grid-template-columns: 1fr; gap: 22px; }
}
@media (max-width: 560px) {
  .pk-wpd { padding: 20px 16px 50px; }
  .pk-wpd-more-grid { grid-template-columns: repeat(2, 1fr); }
}
`;
