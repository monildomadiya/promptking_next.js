"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Crop,
  Download,
  Image as ImageIcon,
  Monitor,
  RectangleHorizontal,
  Smartphone,
  Square,
  Tablet,
} from '@/components/Common/Icons';
import { buildDownloadUrl, DOWNLOAD_SIZES, NO_CATEGORY, previewUrl, sizeRatio } from '@/lib/wallpaperUrls';
import CropStage, { CropPreview, coverCrop } from '@/components/Wallpapers/CropStage';
import WallpaperImage from '@/components/Wallpapers/WallpaperImage';
import api from '@/lib/api';

/**
 * A wallpaper, and the one decision worth making about it before saving it.
 *
 * The old page offered three fixed buttons and let the server pick the crop.
 * On a 5120 × 2160 source that meant handing someone a phone wallpaper made of
 * whatever quarter of the image an algorithm found interesting — so the page is
 * now built around the crop instead of around the buttons: pick the shape, drag
 * the box, watch the result, save it.
 */

const FITS = [
  { id: 'phone', Icon: Smartphone, short: '9:16' },
  { id: 'phoneTall', Icon: Smartphone, short: '9:19.5' },
  { id: 'tablet', Icon: Tablet, short: '3:4' },
  { id: 'square', Icon: Square, short: '1:1' },
  { id: 'desktop', Icon: Monitor, short: '16:9' },
  { id: 'ultrawide', Icon: RectangleHorizontal, short: '21:9' },
  { id: 'custom', Icon: Crop, short: 'free' },
  { id: 'original', Icon: ImageIcon, short: 'as-is' },
];

const round = (n) => Math.max(1, Math.round(n));

export default function ClientWallpaperDetail({ wallpaper, more = [] }) {
  const [fit, setFit] = useState('phone');
  const [taken, setTaken] = useState(false);
  const [natural, setNatural] = useState({
    w: wallpaper.width || 0,
    h: wallpaper.height || 0,
  });

  // Until the file has loaded and the row carries no dimensions, a square is
  // the least wrong assumption; the crop is recomputed the moment the real
  // shape is known.
  const aspect = natural.w && natural.h ? natural.w / natural.h : 1;
  const ratio = sizeRatio(fit);
  const spec = DOWNLOAD_SIZES[fit];
  const whole = fit === 'original';

  const [crop, setCrop] = useState(() => coverCrop(aspect, ratio));

  // Changing the shape invalidates the box: a 16:9 window is not a 9:16 one
  // nudged sideways. Keyed on the pair so a late-arriving natural size also
  // re-fits, and guarded so it does not fight the visitor's own dragging.
  const shape = `${fit}:${aspect.toFixed(5)}`;
  const lastShape = useRef(shape);
  useEffect(() => {
    if (lastShape.current === shape) return;
    lastShape.current = shape;
    setCrop(coverCrop(aspect, ratio));
  }, [shape, aspect, ratio]);

  const src = useMemo(() => previewUrl(wallpaper.image, 1400), [wallpaper.image]);

  /*
   * Back to the collection this visitor came from, not to the whole wall.
   *
   * Guarded on the wallpaper actually belonging to that category, which makes
   * the link self-correcting: arrive here straight from a search result with a
   * stale filter still in storage and the guard fails, so the link is the
   * plain listing rather than a collection this wallpaper is not even in.
   *
   * Starts at /wallpapers so the server and the first client render agree.
   */
  const [backHref, setBackHref] = useState('/wallpapers');
  useEffect(() => {
    let search = '';
    try {
      search = window.sessionStorage.getItem('pk-wallpapers-return') || '';
    } catch {
      return;
    }
    const from = new URLSearchParams(search).get('category');
    // The bucket counts as this wallpaper's collection when it has no other.
    const belongs = from === NO_CATEGORY ? !wallpaper.categorySlug : from === wallpaper.categorySlug;
    if (from && belongs) setBackHref(`/wallpapers?category=${encodeURIComponent(from)}`);
  }, [wallpaper.categorySlug]);

  const href = buildDownloadUrl(wallpaper.image, {
    size: fit,
    slug: wallpaper.slug,
    crop: whole ? null : crop,
  });

  // Neither Cloudinary nor the bucket: the file is somewhere we cannot reshape
  // or force a download from, so the page drops back to showing it whole.
  const croppable = Boolean(buildDownloadUrl(wallpaper.image, { size: 'phone', slug: wallpaper.slug }));

  const cropPx = {
    w: round(crop.w * (natural.w || 0)),
    h: round(crop.h * (natural.h || 0)),
  };
  const outputLabel = spec.w && spec.h ? `${spec.w} × ${spec.h}` : `${cropPx.w} × ${cropPx.h}`;

  // How much of a resize is an enlargement. Below 1 the file is being stretched
  // to reach the requested size, which is worth saying out loud rather than
  // quietly shipping a soft wallpaper.
  const headroom = spec.w && spec.h && natural.w ? Math.min(cropPx.w / spec.w, cropPx.h / spec.h) : 1;
  const quality =
    headroom >= 1
      ? { tone: 'good', text: 'Full quality at this size' }
      : headroom >= 0.72
        ? { tone: 'ok', text: 'Slightly upscaled — still sharp' }
        : { tone: 'warn', text: 'Zoom out for a sharper file' };

  const kept = Math.round(crop.w * crop.h * 100);

  /*
   * Where the zoom track's safe zone ends.
   *
   * At zoom z the window is `cover.w / z` of the source, so it carries
   * `natural.w * cover.w / z` real pixels; the point where that equals the
   * output's width is the last zoom that does not enlarge. The stage knows
   * neither the file's true size nor the size being asked for, so the number
   * is worked out here and handed over.
   */
  const cover = coverCrop(aspect, ratio);
  const sharpUntil = spec.w && natural.w ? (natural.w * cover.w) / spec.w : null;

  const record = () => {
    setTaken(true);
    // Fire-and-forget: the download is already under way and must not wait on,
    // or be cancelled by, our own analytics call.
    api.post('/record_download', { slug: wallpaper.slug }).catch(() => {});
    window.setTimeout(() => setTaken(false), 2400);
  };

  const linkProps = croppable
    ? // Same-origin for a bucket wallpaper, and Cloudinary sets
      // Content-Disposition itself, so the attribute is honoured either way.
      { href, download: '' }
    : { href: wallpaper.image, target: '_blank', rel: 'noopener noreferrer' };

  return (
    <main className="pk-wp">
      <style>{styles}</style>

      <Link href={backHref} className="pk-wp-back">
        <ArrowLeft size={15} />
        {backHref === '/wallpapers' ? 'All wallpapers' : `Back to ${wallpaper.categoryName || 'Others'}`}
      </Link>

      <div className="pk-wp-grid">
        <section className="pk-wp-stage-col">
          <CropStage
            src={src}
            alt={wallpaper.title}
            imageAspect={aspect}
            ratio={ratio}
            crop={crop}
            onChange={setCrop}
            whole={whole || !croppable}
            sharpUntil={sharpUntil}
            readout={`${cropPx.w} × ${cropPx.h}`}
            onNaturalSize={(w, h) => {
              setNatural((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
            }}
          />

          {croppable && !whole && (
            <p className="pk-wp-hint">
              Drag the box to move it, the corners to resize — keeping {kept}% of the image.
            </p>
          )}
        </section>

        <aside className="pk-wp-panel">
          <header className="pk-wp-head">
            <h1>{wallpaper.title}</h1>
            {wallpaper.description && <p className="pk-wp-desc">{wallpaper.description}</p>}
            <div className="pk-wp-meta">
              {natural.w > 0 && (
                <span>
                  {natural.w} × {natural.h}
                </span>
              )}
              {wallpaper.categoryName && <span>{wallpaper.categoryName}</span>}
              {wallpaper.downloadCount > 0 && <span>{wallpaper.downloadCount.toLocaleString()} downloads</span>}
              <span className="pk-wp-free">Free · no sign-up</span>
            </div>
          </header>

          {croppable && (
            <section className="pk-wp-fit">
              <h2>
                Fit to <span>your screen</span>
              </h2>
              <div className="pk-wp-chips" role="radiogroup" aria-label="Download shape">
                {FITS.map(({ id, Icon, short }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={fit === id}
                    className={`pk-wp-chip ${fit === id ? 'is-on' : ''}`}
                    onClick={() => setFit(id)}
                  >
                    <Icon size={15} />
                    <span>{DOWNLOAD_SIZES[id].label}</span>
                    <small>{short}</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="pk-wp-out">
            {croppable && !whole ? (
              <CropPreview
                src={src}
                crop={crop}
                ratio={ratio}
                imageAspect={aspect}
                className="pk-wp-out-thumb"
                label="Preview"
              />
            ) : (
              <div className="pk-wp-out-thumb pk-wp-out-plain">
                <img src={src} alt="" aria-hidden="true" />
              </div>
            )}
            <div className="pk-wp-out-text">
              <strong>{outputLabel}</strong>
              <small>
                {whole ? 'The file exactly as uploaded' : `${kept}% of the original, recut`}
              </small>
              {croppable && !whole && <em className={`pk-wp-q is-${quality.tone}`}>{quality.text}</em>}
            </div>
          </section>

          <a className={`pk-wp-save ${taken ? 'is-done' : ''}`} {...linkProps} onClick={record}>
            {taken ? <Check size={18} /> : <Download size={18} />}
            <span>{taken ? 'Saved to your device' : `Download ${DOWNLOAD_SIZES[fit].label.toLowerCase()}`}</span>
          </a>

          {croppable && fit !== 'original' && (
            <a
              className="pk-wp-alt"
              href={buildDownloadUrl(wallpaper.image, { size: 'original', slug: wallpaper.slug })}
              download=""
              onClick={record}
            >
              <ImageIcon size={14} /> Or take the untouched original
            </a>
          )}

          {wallpaper.tags.length > 0 && (
            <div className="pk-wp-tags">
              {wallpaper.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}

          {wallpaper.promptKey && (
            <Link href={`/prompt/${wallpaper.promptKey}`} className="pk-wp-prompt">
              See the prompt that made this
            </Link>
          )}
        </aside>
      </div>

      {more.length > 0 && (
        <section className="pk-wp-more">
          <h2>More wallpapers</h2>
          <div className="pk-wp-more-grid">
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

      {/* On a phone the download button would otherwise sit below the fold for
          the entire time the visitor is adjusting the crop, which is exactly
          when they are most likely to want it. */}
      <div className="pk-wp-dock">
        <div className="pk-wp-dock-info">
          <strong>{DOWNLOAD_SIZES[fit].label}</strong>
          <small>{outputLabel}</small>
        </div>
        <a className={`pk-wp-save ${taken ? 'is-done' : ''}`} {...linkProps} onClick={record}>
          {taken ? <Check size={18} /> : <Download size={18} />}
          <span>{taken ? 'Saved' : 'Download'}</span>
        </a>
      </div>
    </main>
  );
}

const styles = `
.pk-wp { max-width: var(--container-max); width: 100%; margin: 0 auto; padding: 24px var(--container-pad) 70px; }

.pk-wp-back {
  display: inline-flex; align-items: center; gap: 7px; margin-bottom: 18px;
  font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); text-decoration: none;
}
.pk-wp-back:hover { color: var(--accent-main); }

.pk-wp-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(330px, 0.85fr); gap: 34px; align-items: start; }

.pk-wp-stage-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.pk-wp-hint { margin: 0; font-size: 0.78rem; line-height: 1.6; color: var(--text-secondary); text-align: center; }
.pk-wp-hint span { display: inline-block; }

/* Sticky, because the crop is on the left and the answer to "what will I get"
   is on the right: they have to be readable at the same time. */
.pk-wp-panel {
  display: flex; flex-direction: column; gap: 16px; min-width: 0;
  position: sticky; top: 18px;
}

.pk-wp-head { display: flex; flex-direction: column; gap: 10px; }
.pk-wp-head h1 {
  margin: 0; font-size: clamp(1.45rem, 3.2vw, 2.05rem);
  font-weight: 900; letter-spacing: -0.7px; line-height: 1.2; color: var(--text-main);
}
.pk-wp-desc { margin: 0; font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); }

.pk-wp-meta { display: flex; flex-wrap: wrap; gap: 7px; font-size: 0.73rem; color: var(--text-secondary); }
.pk-wp-meta span { padding: 5px 11px; border-radius: 30px; background: var(--surface-2); border: 1px solid var(--border-color); }
.pk-wp-meta .pk-wp-free { background: rgba(15,157,118,0.1); border-color: rgba(15,157,118,0.3); color: #0b7d5c; font-weight: 700; }

.pk-wp-fit h2 {
  margin: 0 0 10px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1.3px;
  text-transform: uppercase; color: var(--text-secondary);
}
.pk-wp-fit h2 span { color: var(--accent-main); }

.pk-wp-chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.pk-wp-chip {
  display: flex; align-items: center; gap: 8px; cursor: pointer; text-align: left;
  padding: 10px 12px; border-radius: 13px; min-width: 0;
  background: var(--surface-0); border: 1px solid var(--border-color); color: var(--text-main);
  font-size: 0.82rem; font-weight: 700;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}
.pk-wp-chip span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pk-wp-chip small { font-size: 0.66rem; font-weight: 700; opacity: 0.55; letter-spacing: 0.2px; }
.pk-wp-chip:hover { border-color: rgba(229,9,20,0.4); }
.pk-wp-chip.is-on { background: var(--accent-main); border-color: var(--accent-main); color: #fff; }
.pk-wp-chip.is-on small { opacity: 0.8; }

.pk-wp-out {
  display: flex; align-items: center; gap: 14px;
  padding: 12px; border-radius: 16px;
  background: var(--surface-1); border: 1px solid var(--border-color);
}
.pk-wp-out-thumb { width: 78px; flex-shrink: 0; }
.pk-wp-out-plain { position: relative; overflow: hidden; border-radius: 12px; aspect-ratio: 1; border: 1px solid var(--border-color); }
.pk-wp-out-plain img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pk-wp-out-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.pk-wp-out-text strong { font-size: 1.02rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.2px; }
.pk-wp-out-text small { font-size: 0.75rem; color: var(--text-secondary); }
.pk-wp-q { font-size: 0.72rem; font-weight: 700; font-style: normal; }
.pk-wp-q.is-good { color: #0b7d5c; }
.pk-wp-q.is-ok { color: #a06400; }
.pk-wp-q.is-warn { color: var(--accent-main); }

.pk-wp-save {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 15px 18px; border-radius: 15px; text-decoration: none; cursor: pointer;
  background: var(--accent-main); color: #fff; border: 1px solid var(--accent-main);
  font-size: 0.95rem; font-weight: 800; letter-spacing: -0.1px;
  transition: filter 0.18s ease, transform 0.18s ease, background 0.18s ease;
}
.pk-wp-save:hover { filter: brightness(1.08); transform: translateY(-1px); }
.pk-wp-save.is-done { background: #0b7d5c; border-color: #0b7d5c; }

.pk-wp-alt {
  align-self: center; display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-decoration: none;
}
.pk-wp-alt:hover { color: var(--accent-main); }

.pk-wp-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.pk-wp-tags span {
  padding: 4px 10px; border-radius: 30px; font-size: 0.72rem;
  background: var(--surface-2); border: 1px solid var(--border-color); color: var(--text-secondary);
}

.pk-wp-prompt {
  align-self: flex-start; font-size: 0.82rem; font-weight: 700;
  color: var(--accent-main); text-decoration: underline; text-underline-offset: 3px;
}

.pk-wp-more { margin-top: 54px; }
.pk-wp-more h2 { margin: 0 0 16px; font-size: 1.1rem; font-weight: 800; color: var(--text-main); }
.pk-wp-more-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
.pk-wp-more-grid a { text-decoration: none; display: flex; flex-direction: column; gap: 7px; }
.pk-wp-more-grid picture { display: contents; }
.pk-wp-more-grid img {
  width: 100%; aspect-ratio: 3 / 4; object-fit: cover; display: block;
  border-radius: 14px; border: 1px solid var(--border-color);
}
.pk-wp-more-grid span {
  font-size: 0.8rem; font-weight: 700; color: var(--text-main);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* The dock is the phone layout's primary action and does not exist above it. */
.pk-wp-dock { display: none; }

@media (max-width: 1000px) {
  .pk-wp-grid { grid-template-columns: 1fr; gap: 22px; }
  .pk-wp-panel { position: static; }
}

@media (max-width: 900px) {
  /* Below the dock, so the last of the page is never trapped under it. */
  .pk-wp { padding-bottom: 104px; }

  .pk-wp-dock {
    display: flex; align-items: center; gap: 12px;
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px));
    background: var(--glass-bg); backdrop-filter: var(--glass-blur);
    border-top: 1px solid var(--border-color);
  }
  .pk-wp-dock-info { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
  .pk-wp-dock-info strong { font-size: 0.86rem; font-weight: 800; color: var(--text-main); }
  .pk-wp-dock-info small { font-size: 0.72rem; color: var(--text-secondary); }
  .pk-wp-dock .pk-wp-save { flex: 1; padding: 13px 16px; font-size: 0.9rem; }

  /* One save button on screen at a time; the panel's own is the one that goes. */
  .pk-wp-panel > .pk-wp-save { display: none; }
}

@media (max-width: 560px) {
  .pk-wp { padding: 18px var(--container-pad) 104px; }
  .pk-wp-chips { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
  .pk-wp-chip { padding: 11px 10px; font-size: 0.78rem; min-height: 44px; }
  .pk-wp-out { padding: 10px; gap: 12px; }
  .pk-wp-out-thumb { width: 64px; }
  .pk-wp-more-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 380px) {
  .pk-wp-chip small { display: none; }
}
`;
