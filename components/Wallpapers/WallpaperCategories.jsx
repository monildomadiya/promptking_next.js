import React from 'react';
import Link from 'next/link';
import { ArrowRight } from '@/components/Common/Icons';
import WallpaperImage from '@/components/Wallpapers/WallpaperImage';

/**
 * The home page's wallpaper section: the categories, and nothing else.
 *
 * It used to be a marquee of individual wallpapers with the categories above
 * it — two horizontal image rows stacked, saying the same thing twice. What
 * survives is the half that leads somewhere: every capsule is a link into a
 * collection, and each one still shows real artwork, because a category
 * written as the word "Abstract" tells a visitor nothing about what they are
 * about to get.
 *
 * The shape is deliberate. A standing lozenge is not a card, not a circle and
 * not a thumbnail — nothing else on the site looks like it — so a row of them
 * reads as navigation at a glance rather than as more content to scroll past.
 *
 * Names sit below the images: on a shape this narrow, with both ends rounded
 * away, a label inside would either be clipped by the curve or need a scrim
 * heavy enough to hide the picture it is labelling.
 *
 * Server-rendered — these are crawlable links into a section that exists to be
 * found, and there is no state here worth shipping a client component for.
 */
export default function WallpaperCategories({ categories = [] }) {
  if (categories.length === 0) return null;

  return (
    <section className="pk-wcat" aria-labelledby="pk-wcat-title">
      <style>{styles}</style>

      <div className="pk-wcat-head">
        <div className="pk-wcat-title">
          <h2 id="pk-wcat-title">
            Free AI <span>Wallpapers</span>
          </h2>
          <p>Phone and desktop resolutions, cropped to your screen. No sign-up.</p>
        </div>
        <Link href="/wallpapers" className="pk-wcat-all">
          See all <ArrowRight size={15} />
        </Link>
      </div>

      <div className="pk-wcat-rail">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/wallpapers?category=${encodeURIComponent(category.slug)}`}
            className="pk-wcat-item"
          >
            <span className="pk-wcat-pill">
              <WallpaperImage
                image={category.image}
                alt=""
                ratio="4:5"
                widths={[150, 300, 450]}
                sizes="(max-width: 560px) 96px, 132px"
              />
            </span>
            <span className="pk-wcat-name">{category.name}</span>
            <span className="pk-wcat-count">
              {category.count} wallpaper{category.count === 1 ? '' : 's'}
            </span>
          </Link>
        ))}

        <Link href="/wallpapers" className="pk-wcat-item">
          <span className="pk-wcat-pill is-more">
            <span>
              View all <ArrowRight size={14} />
            </span>
          </span>
          <span className="pk-wcat-name">Everything</span>
          <span className="pk-wcat-count">Browse the lot</span>
        </Link>
      </div>
    </section>
  );
}

const styles = `
/* A panel rather than a bare band. The header and the footer on this site are
   both rounded cards on the container's width, so a third one here reads as
   part of the page rather than as something dropped into the middle of it —
   and it gives the wallpapers their own ground between two grids of prompts. */
.pk-wcat {
  width: calc(100% - 2 * var(--gutter));
  max-width: var(--container-inner);
  margin: 0 auto 40px;
  padding: clamp(18px, 2.4vw, 26px) clamp(14px, 2vw, 24px);
  border-radius: 26px;
  border: 1px solid var(--border-color);
  background:
    radial-gradient(120% 140% at 8% 0%, rgba(229,9,20,0.055), transparent 62%),
    var(--surface-1);
}

.pk-wcat-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 14px; flex-wrap: wrap; margin-bottom: 16px;
}
.pk-wcat-title { min-width: 0; }
.pk-wcat-head h2 {
  margin: 0 0 4px; font-size: clamp(1.15rem, 3vw, 1.5rem);
  font-weight: 900; letter-spacing: -0.5px; color: var(--text-main);
}
.pk-wcat-head h2 span { color: var(--accent-main); }
.pk-wcat-head p { margin: 0; font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); }

.pk-wcat-all {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 9px 17px; border-radius: 30px; text-decoration: none;
  background: var(--accent-main); color: #fff;
  font-size: 0.82rem; font-weight: 800;
  transition: filter 0.18s ease, transform 0.18s ease;
}
.pk-wcat-all:hover { filter: brightness(1.08); transform: translateY(-1px); }

/* Start-aligned, always. Centring a scrolling row is the trap: the moment it
   overflows, the first items are pushed into space the scrollbar cannot
   reach — and with only two categories, centred also leaves them stranded in
   the middle of a wide panel with the heading marooned to their left. */
.pk-wcat-rail {
  display: flex; gap: clamp(9px, 1.2vw, 14px);
  overflow-x: auto; scrollbar-width: none;
  padding: 2px 2px 4px;
  scroll-snap-type: x proximity; scroll-padding-inline: 2px;
}
.pk-wcat-rail::-webkit-scrollbar { display: none; }

.pk-wcat-item {
  display: flex; flex-direction: column; align-items: center; gap: 9px;
  flex-shrink: 0; scroll-snap-align: start; text-decoration: none;
  width: clamp(96px, 9.5vw, 132px);
}

/* The standing lozenge: a radius far past half the width, so both ends round
   off completely whatever height the ratio works out to. */
.pk-wcat-pill {
  position: relative; display: block; overflow: hidden;
  width: 100%; aspect-ratio: 4 / 5;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: linear-gradient(160deg, var(--surface-2), var(--surface-3));
  transition: transform 0.3s cubic-bezier(0.2,0.8,0.25,1), border-color 0.25s ease;
}
.pk-wcat-pill picture { display: contents; }
.pk-wcat-pill img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.45s cubic-bezier(0.2,0.8,0.25,1);
}
.pk-wcat-item:hover .pk-wcat-pill { transform: translateY(-5px); border-color: rgba(229,9,20,0.5); }
.pk-wcat-item:hover .pk-wcat-pill img { transform: scale(1.07); }

/* The last capsule has no wallpaper to show, so it says what it is instead. */
.pk-wcat-pill.is-more {
  display: flex; align-items: center; justify-content: center; text-align: center;
  padding: 10px;
  background: linear-gradient(165deg, #1e2231, #0b0d14 72%);
  border-color: rgba(255,255,255,0.12);
}
.pk-wcat-pill.is-more span {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.75rem; font-weight: 800; color: #fff; line-height: 1.3;
}

.pk-wcat-name {
  font-size: 0.82rem; font-weight: 800; color: var(--text-main);
  text-align: center; line-height: 1.3;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  transition: color 0.2s ease;
}
.pk-wcat-item:hover .pk-wcat-name { color: var(--accent-main); }
.pk-wcat-count {
  margin-top: -6px;
  font-size: 0.68rem; font-weight: 600; color: var(--text-secondary); text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .pk-wcat-pill, .pk-wcat-pill img, .pk-wcat-all { transition: none; }
  .pk-wcat-item:hover .pk-wcat-pill { transform: none; }
  .pk-wcat-item:hover .pk-wcat-pill img { transform: none; }
}

@media (max-width: 620px) {
  /* The heading stacks and the button drops to its own line rather than
     squeezing the title into two words a line. */
  .pk-wcat-head { align-items: stretch; gap: 12px; }
  /* Stacked and full-height: once it is on its own line it is the section's
     one button, and 34px is under the size a thumb reliably hits. */
  .pk-wcat-all { align-self: flex-start; min-height: 44px; padding: 0 20px; }
}

@media (max-width: 560px) {
  .pk-wcat { margin-bottom: 26px; border-radius: 20px; }
  .pk-wcat-head { margin-bottom: 13px; }
  .pk-wcat-head p { font-size: 0.8rem; }
  /* The rail takes the panel's padding back so a capsule can sit against each
     edge — a row that stops short on both sides looks like it has ended. */
  .pk-wcat-rail {
    margin-inline: calc(-1 * clamp(14px, 2vw, 24px));
    padding-inline: clamp(14px, 2vw, 24px);
    scroll-padding-inline: clamp(14px, 2vw, 24px);
  }
  .pk-wcat-name { font-size: 0.76rem; }
  .pk-wcat-count { font-size: 0.64rem; }
}
`;
