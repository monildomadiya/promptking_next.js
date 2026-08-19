import React from 'react';
import { cropUrl, cropSrcSet } from '@/lib/wallpaperUrls';

/**
 * The wallpaper shown on the device it is meant for.
 *
 * A 1080x1920 file rendered at column width is about 1270px tall: the preview
 * ran off the bottom of the screen and the download buttons sat beside a wall
 * of image. Framing it fixes the height problem, but the reason to prefer a
 * frame over a plain `max-height` is that it answers a question a flat preview
 * cannot — what this looks like on the thing you are about to set it on.
 *
 * The crops match the download exactly: 9:16 here is the same c_fill,g_auto
 * Cloudinary performs for the phone file, 16:9 the same as the desktop one. So
 * the frame is not a flattering mock-up — whatever the subject loses to the
 * crop is visible here, before the download rather than after it.
 */
const FRAMES = {
  phone: { ratio: '9:16', widths: [270, 400, 540, 800] },
  desktop: { ratio: '16:9', widths: [480, 720, 960, 1400] },
};

export default function DevicePreview({ image, title, mode = 'phone' }) {
  const { ratio, widths } = FRAMES[mode] || FRAMES.phone;

  const src = cropUrl(image, { width: widths[1], ratio, quality: 'good' });
  const srcSet = cropSrcSet(image, widths, { ratio, quality: 'good' });
  const avif = cropSrcSet(image, widths, { ratio, quality: 'good', format: 'avif' });
  const sizes = mode === 'phone' ? '(max-width: 900px) 62vw, 300px' : '(max-width: 900px) 92vw, 620px';

  const picture = (
    <picture>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <img src={src} srcSet={srcSet} sizes={sizes} alt={title} fetchPriority="high" decoding="async" />
    </picture>
  );

  return (
    // No mode modifier here: `pk-dev-phone` is the inner frame's class, and
    // repeating it on the wrapper gave the wrapper the frame's gradient,
    // radius, shadow and aspect-ratio — a second phone shell drawn around the
    // real one at 588x444.
    <div className="pk-dev">
      <style>{styles}</style>

      {mode === 'phone' ? (
        <div className="pk-dev-phone">
          <div className="pk-dev-screen">
            {picture}
            {/* Lock-screen furniture, because a wallpaper is judged behind it:
                a busy top third is exactly where a clock becomes unreadable. */}
            <div className="pk-dev-lock">
              <span className="pk-dev-time">9:41</span>
              <span className="pk-dev-date">Monday, 9 June</span>
            </div>
          </div>
          <span className="pk-dev-island" aria-hidden="true" />
        </div>
      ) : (
        <div className="pk-dev-monitor">
          <div className="pk-dev-bezel">
            <div className="pk-dev-screen">{picture}</div>
          </div>
          <span className="pk-dev-neck" aria-hidden="true" />
          <span className="pk-dev-foot" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

const styles = `
.pk-dev { display: flex; justify-content: center; width: 100%; }
.pk-dev picture { display: contents; }

/* Absolute, not just width/height 100%. In flow the image contributes its own
   intrinsic width to the frame's content size, which wins over aspect-ratio —
   the phone came out 588x444, landscape, instead of 205x444. Taking it out of
   flow leaves height and aspect-ratio to decide the box. */
.pk-dev img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover; display: block;
}

.pk-dev-screen { position: relative; width: 100%; height: 100%; overflow: hidden; }

/* ── Phone ─────────────────────────────────────────────────────────────── */
.pk-dev-phone {
  position: relative; flex: 0 0 auto;
  /* Height-led rather than width-led: the viewport is what this has to fit
     inside, and a tall frame sized from its width overflows every time. */
  height: min(64vh, 560px);
  aspect-ratio: 9 / 19.5;
  padding: 9px;
  border-radius: 44px;
  background: linear-gradient(160deg, #2c2c30, #0d0d10);
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.07) inset,
    0 26px 60px rgba(0,0,0,0.34),
    0 6px 16px rgba(0,0,0,0.2);
}
.pk-dev-phone .pk-dev-screen { border-radius: 36px; }

.pk-dev-island {
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
  width: 30%; height: 20px; border-radius: 20px; background: #000;
}

.pk-dev-lock {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: flex-start; gap: 2px;
  padding-top: 15%; color: #fff; pointer-events: none;
  text-shadow: 0 2px 12px rgba(0,0,0,0.4);
}
.pk-dev-time { font-size: clamp(2rem, 7vh, 3.1rem); font-weight: 300; letter-spacing: -1px; line-height: 1; }
.pk-dev-date { font-size: clamp(0.6rem, 1.6vh, 0.78rem); font-weight: 600; opacity: 0.92; }

/* ── Desktop ───────────────────────────────────────────────────────────── */
.pk-dev-monitor { display: flex; flex-direction: column; align-items: center; width: 100%; flex: 1 1 auto; }
.pk-dev-bezel {
  width: 100%; aspect-ratio: 16 / 9; padding: 11px 11px 26px;
  border-radius: 16px;
  background: linear-gradient(160deg, #2c2c30, #0d0d10);
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.07) inset,
    0 22px 50px rgba(0,0,0,0.3);
  position: relative;
}
.pk-dev-bezel::after {
  content: ''; position: absolute; bottom: 9px; left: 50%; transform: translateX(-50%);
  width: 46px; height: 3px; border-radius: 3px; background: rgba(255,255,255,0.18);
}
.pk-dev-bezel .pk-dev-screen { border-radius: 6px; }
.pk-dev-neck { width: 84px; height: 22px; background: linear-gradient(180deg, #232327, #17171a); }
.pk-dev-foot { width: 190px; height: 9px; border-radius: 0 0 9px 9px; background: linear-gradient(180deg, #1d1d21, #101013); }

@media (max-width: 900px) {
  .pk-dev-phone { height: min(56vh, 480px); }
}
@media (max-width: 560px) {
  .pk-dev-phone { height: min(52vh, 420px); border-radius: 36px; padding: 7px; }
  .pk-dev-phone .pk-dev-screen { border-radius: 30px; }
  .pk-dev-island { top: 15px; height: 17px; }
}
`;
