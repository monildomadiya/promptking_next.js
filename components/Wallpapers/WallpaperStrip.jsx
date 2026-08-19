import React from 'react';
import Link from 'next/link';
import { Download, ArrowRight } from '@/components/Common/Icons';
import WallpaperImage from '@/components/Wallpapers/WallpaperImage';

/**
 * The home page's advert for the wallpapers section.
 *
 * The section is one click from the header and one line in the footer, which
 * is enough to be found and not enough to be noticed. A moving row of the
 * actual images says what the section is without asking anyone to read a
 * label.
 *
 * The scroll is a CSS animation on a duplicated track rather than a timer
 * nudging scrollLeft. A timer would fight the user's own scrolling, keep the
 * main thread busy on a page that already renders thirty cards, and carry on
 * running in a background tab.
 */
const MARQUEE_MIN = 5;

export default function WallpaperStrip({ wallpapers = [] }) {
  if (wallpapers.length === 0) return null;

  // Below the threshold the track cannot fill the viewport, so an infinite
  // scroll would be a short row sliding away from a growing gap. It stays a
  // plain scrollable row until there is enough to loop.
  const animate = wallpapers.length >= MARQUEE_MIN;

  // A seamless loop needs the sequence twice: the animation travels exactly
  // one copy's width and resets, and the second copy is what occupies the
  // space the first has vacated.
  const track = animate ? [...wallpapers, ...wallpapers] : wallpapers;

  return (
    <section className="pk-strip" aria-labelledby="pk-strip-title">
      <style>{styles}</style>

      <div className="pk-strip-head">
        <div>
          <h2 id="pk-strip-title">
            Free AI <span>Wallpapers</span>
          </h2>
          <p>Phone and desktop resolutions, one tap to download. No sign-up.</p>
        </div>
        <Link href="/wallpapers" className="pk-strip-all">
          See all <ArrowRight size={15} />
        </Link>
      </div>

      <div className={`pk-strip-view ${animate ? 'is-animated' : ''}`}>
        <div className="pk-strip-track">
          {track.map((w, i) => {
            // The second copy is decoration; exposing it would repeat every
            // wallpaper twice to a screen reader and to anything crawling the
            // markup for links.
            const isClone = animate && i >= wallpapers.length;
            return (
              <Link
                key={`${w.slug}-${i}`}
                href={`/wallpapers/${w.slug}`}
                className="pk-strip-card"
                aria-hidden={isClone || undefined}
                tabIndex={isClone ? -1 : undefined}
              >
                <WallpaperImage
                  image={w.image}
                  alt={isClone ? '' : w.title}
                  widths={[150, 300, 450]}
                  sizes="(max-width: 560px) 124px, 148px"
                />
                <span className="pk-strip-grab">
                  <Download size={13} />
                </span>
                <span className="pk-strip-name">{w.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const styles = `
.pk-strip { margin: 0 auto 44px; max-width: var(--container-max); width: 100%; }

.pk-strip-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; padding: 0 20px; margin-bottom: 16px;
}
.pk-strip-head h2 {
  margin: 0 0 5px; font-size: clamp(1.15rem, 3vw, 1.5rem);
  font-weight: 900; letter-spacing: -0.5px; color: var(--text-main);
}
.pk-strip-head h2 span { color: var(--accent-main); }
.pk-strip-head p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); }

.pk-strip-all {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 9px 17px; border-radius: 30px; text-decoration: none;
  background: var(--accent-main); color: #fff;
  font-size: 0.82rem; font-weight: 800;
  transition: filter 0.2s ease, transform 0.2s ease;
}
.pk-strip-all:hover { filter: brightness(1.08); transform: translateY(-1px); }

/* The viewport clips the track and fades both ends, so the row reads as
   continuing past the screen rather than being cut off at it. */
.pk-strip-view {
  overflow-x: auto; overflow-y: hidden;
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
  padding: 4px 20px 6px;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 36px, #000 calc(100% - 36px), transparent);
          mask-image: linear-gradient(to right, transparent, #000 36px, #000 calc(100% - 36px), transparent);
}
.pk-strip-view::-webkit-scrollbar { display: none; }

.pk-strip-track { display: flex; gap: 14px; width: max-content; }

.pk-strip-view.is-animated .pk-strip-track {
  animation: pk-strip-scroll 46s linear infinite;
}
/* Pausing on hover is what makes the row usable rather than decorative: a
   card that is drifting away is a card nobody clicks. */
.pk-strip-view.is-animated:hover .pk-strip-track,
.pk-strip-view.is-animated:focus-within .pk-strip-track { animation-play-state: paused; }

@keyframes pk-strip-scroll {
  from { transform: translate3d(0, 0, 0); }
  /* Half the track is exactly one copy of the list, gap included, because the
     duplicate contributes an identical trailing gap. */
  to   { transform: translate3d(calc(-50% - 7px), 0, 0); }
}

.pk-strip-card {
  position: relative; flex-shrink: 0; display: block; text-decoration: none;
  width: 148px; aspect-ratio: 3 / 4; border-radius: 16px; overflow: hidden;
  background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.08);
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease;
}
.pk-strip-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(0,0,0,0.16);
}
/* <picture> is inline by default, so a percentage height on the <img> inside
   would resolve against an auto-height box and collapse. display:contents
   removes the wrapper from layout entirely and leaves the img as a direct
   child of the card. */
.pk-strip-card picture { display: contents; }
.pk-strip-card img { width: 100%; height: 100%; object-fit: cover; display: block; }

.pk-strip-grab {
  position: absolute; top: 9px; right: 9px;
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.92); color: #14161a;
  opacity: 0; transform: scale(0.8);
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.pk-strip-card:hover .pk-strip-grab { opacity: 1; transform: scale(1); }

.pk-strip-name {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 22px 10px 9px;
  font-size: 0.73rem; font-weight: 700; line-height: 1.3; color: #fff;
  background: linear-gradient(to top, rgba(0,0,0,0.78), transparent);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* An endlessly moving band is exactly what this setting exists to switch off. */
@media (prefers-reduced-motion: reduce) {
  .pk-strip-view.is-animated .pk-strip-track { animation: none; }
}

@media (max-width: 560px) {
  .pk-strip { margin-bottom: 32px; }
  .pk-strip-head { padding: 0 28px; align-items: flex-start; }
  .pk-strip-view { padding-inline: 28px; }
  .pk-strip-card { width: 124px; border-radius: 13px; }
}
`;
