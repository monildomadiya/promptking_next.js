"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from '@/components/Common/Icons';

/**
 * The crop window a visitor drags before downloading a wallpaper.
 *
 * The problem it solves is the one every wallpaper site has and most ignore: a
 * 5120 × 2160 source cut to a 9:16 phone screen keeps under a quarter of its
 * width, and no subject detection can know whether the quarter you wanted was
 * the car or the sunset. So the crop stops being a guess made on the server
 * and becomes a box on the picture — the whole image stays visible, dimmed, so
 * what is being thrown away is as legible as what is being kept.
 *
 * Everything here is a fraction of the source (0-1, origin top left) rather
 * than a pixel. The stage works from a scaled-down preview and has no business
 * knowing the true size of the file; fractions also keep the resulting `crop=`
 * parameter correct at any resolution, which is what lets one query serve
 * Cloudinary, Cloudflare and sharp alike.
 *
 * Controlled: the parent owns `crop`, because it also owns the download URL
 * built out of it.
 */

const MIN_SIDE = 0.06;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * The one number the geometry turns on: given a source of aspect `imageAspect`
 * and a target of aspect `ratio`, a crop `w` wide must be `w * k` tall for the
 * pixels it selects to come out the right shape. It is constant for a given
 * pair, which is why the box only ever needs one degree of freedom.
 */
const kFactor = (imageAspect, ratio) => (ratio ? imageAspect / ratio : null);

const widthBounds = (imageAspect, ratio) => {
  const k = kFactor(imageAspect, ratio);
  if (!k) return { min: MIN_SIDE, max: 1 };
  // The floor applies to the shorter side, so a very tall crop may be very
  // narrow without the constraint turning it into a hairline.
  return { min: Math.min(0.9, Math.max(MIN_SIDE, MIN_SIDE / k)), max: Math.min(1, 1 / k) };
};

/** The largest window of the target shape that fits, centred. The default. */
export function coverCrop(imageAspect, ratio) {
  const k = kFactor(imageAspect, ratio);
  if (!k) return { x: 0, y: 0, w: 1, h: 1 };
  const w = Math.min(1, 1 / k);
  const h = w * k;
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

/** Same centre, different size — what the slider, the wheel and a pinch do. */
function resized(prev, width, imageAspect, ratio) {
  const k = kFactor(imageAspect, ratio);
  const bounds = widthBounds(imageAspect, ratio);
  const w = clamp(width, bounds.min, bounds.max);
  const h = k ? w * k : clamp(prev.h * (w / prev.w), MIN_SIDE, 1);
  const cx = prev.x + prev.w / 2;
  const cy = prev.y + prev.h / 2;
  return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h };
}

const CORNERS = [
  { id: 'nw', label: 'top left' },
  { id: 'ne', label: 'top right' },
  { id: 'se', label: 'bottom right' },
  { id: 'sw', label: 'bottom left' },
];

export default function CropStage({
  src,
  alt = '',
  imageAspect,
  ratio = null,
  crop,
  onChange,
  onNaturalSize,
  /**
   * The zoom past which the crop no longer has enough source pixels to fill
   * the chosen output — so the track can draw the line rather than leaving the
   * visitor to discover it after the download. Null when nothing is being
   * resized and there is therefore no line to draw.
   */
  sharpUntil = null,
  /** Live figures for the readout; the parent owns the true dimensions. */
  readout = null,
  /** No window and no dimming: the whole file, exactly as uploaded. */
  whole = false,
  maxHeight = 'min(56vh, 520px)',
}) {
  const frameRef = useRef(null);
  const boxRef = useRef({ w: 1, h: 1, left: 0, top: 0 });
  const gestureRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const bounds = widthBounds(imageAspect, ratio);
  const zoomMax = Math.max(1.01, bounds.max / bounds.min);
  const zoom = crop ? clamp(bounds.max / crop.w, 1, zoomMax) : 1;

  // Pointer deltas arrive in CSS pixels and every piece of state here is a
  // fraction, so the frame's rendered size is needed on every move.
  const measure = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    boxRef.current = { w: rect.width || 1, h: rect.height || 1, left: rect.left, top: rect.top };
  }, []);

  useEffect(() => {
    measure();
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const setSize = useCallback(
    (width) => crop && onChange(resized(crop, width, imageAspect, ratio)),
    [crop, imageAspect, ratio, onChange],
  );

  const reset = useCallback(
    () => onChange(coverCrop(imageAspect, ratio)),
    [imageAspect, ratio, onChange],
  );

  /* ── Gestures ──────────────────────────────────────────────────────────
   * One pointer inside the window moves it, one on a corner resizes it, two
   * anywhere pinch it. Pointer events cover mouse, touch and pen at once, and
   * capturing on the frame means a drag that runs off the edge keeps working.
   */

  const beginGesture = (event, mode, corner) => {
    if (whole || !crop) return;
    event.preventDefault();
    measure();
    try {
      frameRef.current?.setPointerCapture(event.pointerId);
    } catch {
      /* Safari throws if the pointer is already gone; the drag still works. */
    }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, crop };
      gestureRef.current = null;
    } else {
      gestureRef.current = { mode, corner, crop, x: event.clientX, y: event.clientY };
    }
    setBusy(true);
  };

  const handleMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const box = boxRef.current;

    if (pinchRef.current && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const start = pinchRef.current;
      // Fingers apart is a tighter crop, so the picture appears to grow.
      onChange(resized(start.crop, start.crop.w * (start.distance / distance), imageAspect, ratio));
      return;
    }

    const gesture = gestureRef.current;
    if (!gesture) return;

    if (gesture.mode === 'move') {
      const dx = (event.clientX - gesture.x) / box.w;
      const dy = (event.clientY - gesture.y) / box.h;
      onChange({
        ...gesture.crop,
        x: clamp(gesture.crop.x + dx, 0, 1 - gesture.crop.w),
        y: clamp(gesture.crop.y + dy, 0, 1 - gesture.crop.h),
      });
      return;
    }

    // Resize. The corner opposite the one being dragged stays put, so the box
    // grows away from a fixed anchor and the room left in each direction is
    // simply the distance from that anchor to the edge of the image.
    const k = kFactor(imageAspect, ratio);
    const start = gesture.crop;
    const east = gesture.corner.includes('e');
    const south = gesture.corner.includes('s');
    const ax = east ? start.x : start.x + start.w;
    const ay = south ? start.y : start.y + start.h;
    const px = clamp((event.clientX - box.left) / box.w, 0, 1);
    const py = clamp((event.clientY - box.top) / box.h, 0, 1);

    const roomW = east ? 1 - ax : ax;
    const roomH = south ? 1 - ay : ay;

    let w;
    let h;
    if (k) {
      // Follow whichever axis the pointer has pulled further, so the corner
      // keeps up with a diagonal drag instead of trailing one axis behind.
      w = clamp(
        Math.max(Math.abs(px - ax), Math.abs(py - ay) / k),
        bounds.min,
        Math.max(bounds.min, Math.min(roomW, roomH / k)),
      );
      h = w * k;
    } else {
      w = clamp(Math.abs(px - ax), MIN_SIDE, Math.max(MIN_SIDE, roomW));
      h = clamp(Math.abs(py - ay), MIN_SIDE, Math.max(MIN_SIDE, roomH));
    }

    onChange({ x: east ? ax : ax - w, y: south ? ay : ay - h, w, h });
  };

  const endGesture = (event) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) {
      gestureRef.current = null;
      setBusy(false);
    }
  };

  /*
   * Wheel-to-zoom, but only for the gesture that means zoom. A trackpad pinch
   * arrives as a wheel event with ctrlKey set, and that one is worth
   * intercepting; a plain scroll over a stage that fills half the screen is
   * someone trying to reach the download button, and taking it would be the
   * map-embed mistake. React's wheel listener is passive, so preventDefault
   * needs a native one.
   */
  useEffect(() => {
    const el = frameRef.current;
    if (!el || whole) return undefined;
    const onWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setSize(crop.w * (event.deltaY > 0 ? 1.06 : 0.94));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // setSize already changes with the crop, so the listener is rebound with it.
  }, [whole, crop, setSize]);

  const MOVES = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

  const handleKeys = (event) => {
    if (whole || !crop) return;
    if (event.key === 'Home') {
      event.preventDefault();
      reset();
      return;
    }
    const move = MOVES[event.key];
    if (!move) return;
    event.preventDefault();
    const [mx, my] = move;
    // Shift turns the arrows into a resize — the only way to change the size
    // of the box without a pointer.
    if (event.shiftKey) setSize(crop.w * (mx + my > 0 ? 1.08 : 0.92));
    else {
      const step = 0.012;
      onChange({
        ...crop,
        x: clamp(crop.x + mx * step, 0, 1 - crop.w),
        y: clamp(crop.y + my * step, 0, 1 - crop.h),
      });
    }
  };

  const box = crop || { x: 0, y: 0, w: 1, h: 1 };
  const percent = (n) => `${(n * 100).toFixed(3)}%`;

  /* ── The instrument ──────────────────────────────────────────────────
   * Zoom runs 1 to zoomMax, so everything on the track is placed by where a
   * zoom falls in that span. `sharpUntil` becomes a mark on it: to the left
   * the crop still carries more pixels than the download needs, to the right
   * the file is being stretched to reach the size — the one thing a zoom
   * control on a wallpaper ought to say and normally does not.
   */
  const place = (z) => clamp(((z - 1) / (zoomMax - 1)) * 100, 0, 100);
  const pct = place(zoom);
  const safePct = sharpUntil ? place(sharpUntil) : 100;
  // A mark hard against either end is noise, not information.
  const showLimit = Boolean(sharpUntil) && safePct > 3 && safePct < 97;

  // One question for the instrument to answer — is the crop still big enough
  // for the file being asked for. How far past is the panel's job to say in
  // words; a control that tries to grade it ends up shouting in three colours.
  const past = Boolean(sharpUntil) && zoom > sharpUntil;

  // Whole-number stops, so the travel has a sense of scale under the thumb.
  const ticks = [];
  for (let z = 2; z <= zoomMax; z += 1) ticks.push(place(z));

  return (
    <div className="pk-cs">
      <style>{stageStyles}</style>

      <div
        className={`pk-cs-frame ${busy ? 'is-busy' : ''} ${whole ? 'is-whole' : ''}`}
        ref={frameRef}
        style={{ '--ar': imageAspect || 1, '--cap': maxHeight }}
        onPointerMove={handleMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
      >
        <img
          className="pk-cs-img"
          src={src}
          alt={alt}
          draggable={false}
          fetchPriority="high"
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth && naturalHeight) onNaturalSize?.(naturalWidth, naturalHeight);
          }}
        />

        {!whole && crop && (
          <div
            className="pk-cs-win"
            role="group"
            tabIndex={0}
            aria-label="Crop area. Drag to move; hold shift with the arrow keys to resize."
            style={{ left: percent(box.x), top: percent(box.y), width: percent(box.w), height: percent(box.h) }}
            onPointerDown={(event) => beginGesture(event, 'move')}
            onKeyDown={handleKeys}
            onDoubleClick={reset}
          >
            <span className="pk-cs-grid" aria-hidden="true" />
            {CORNERS.map(({ id, label }) => (
              <span
                key={id}
                className={`pk-cs-handle is-${id}`}
                aria-hidden="true"
                title={`Resize from the ${label}`}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  beginGesture(event, 'resize', id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {!whole && crop && (
        <div className="pk-cs-bar">
          <div className="pk-cs-controls">
            <button
              type="button"
              className="pk-cs-step"
              onClick={() => setSize(crop.w * 1.12)}
              aria-label="Show more of the image"
            >
              <Minus size={16} />
            </button>

            <div
              className={`pk-cs-slider ${past ? 'is-past' : ''} ${sharpUntil ? 'has-limit' : ''}`}
              style={{ '--pct': pct, '--safe': safePct }}
            >
              <span className="pk-cs-rail" aria-hidden="true" />
              <span className="pk-cs-fill" aria-hidden="true" />
              <span className="pk-cs-over" aria-hidden="true" />
              {ticks.map((t) => (
                <span key={t} className="pk-cs-tick" style={{ '--at': t }} aria-hidden="true" />
              ))}
              {showLimit && <span className="pk-cs-limit" aria-hidden="true" />}
              <span className="pk-cs-knob" aria-hidden="true" />
              <input
                type="range"
                min={1}
                max={zoomMax}
                step={0.01}
                value={zoom}
                aria-label="Zoom"
                aria-valuetext={`${zoom.toFixed(2)} times`}
                onChange={(event) => setSize(bounds.max / Number(event.target.value))}
              />
            </div>

            <button
              type="button"
              className="pk-cs-step"
              onClick={() => setSize(crop.w * 0.89)}
              aria-label="Zoom further in"
            >
              <Plus size={16} />
            </button>

            <button type="button" className="pk-cs-reset" onClick={reset} title="Reset the crop">
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>

          <div className="pk-cs-meter">
            <span className={`pk-cs-zoom ${past ? 'is-past' : ''}`}>
              {zoom.toFixed(2)}
              <em>×</em>
            </span>
            {readout && <span className="pk-cs-readout">{readout}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The crop as the downloaded file will look — the same fractions read as CSS
 * offsets rather than pixels, so the preview cannot drift from what the server
 * is about to cut.
 */
export function CropPreview({ src, crop, ratio, imageAspect, className = '', label }) {
  if (!crop) return null;
  const shape = ratio || (imageAspect * crop.w) / crop.h;
  return (
    <figure className={`pk-cs-prev ${className}`} style={{ aspectRatio: String(shape) }}>
      <style>{previewStyles}</style>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          width: `${100 / crop.w}%`,
          left: `${(-crop.x / crop.w) * 100}%`,
          top: `${(-crop.y / crop.h) * 100}%`,
        }}
      />
      {label && <figcaption>{label}</figcaption>}
    </figure>
  );
}

const stageStyles = `
.pk-cs { display: flex; flex-direction: column; gap: 12px; width: 100%; }

/* Width led by the height cap, so a 21:9 source and a 9:16 one both land
   inside the same box: calc(cap * aspect) is the width that fills the cap
   exactly, and min() hands it back to the column when that is the wider. */
.pk-cs-frame {
  position: relative; overflow: hidden;
  width: min(100%, calc(var(--cap) * var(--ar)));
  aspect-ratio: var(--ar);
  margin: 0 auto; border-radius: 16px;
  background: #0b0d14;
  /* Only the frame itself opts out of native panning; the page beyond it
     still scrolls, which is why the stage is height-capped. */
  touch-action: none;
}
.pk-cs-frame.is-whole { touch-action: auto; }
.pk-cs-img {
  display: block; width: 100%; height: 100%; object-fit: cover;
  user-select: none; -webkit-user-drag: none;
}

.pk-cs-win {
  position: absolute; cursor: grab;
  outline: 2px solid rgba(255,255,255,0.95);
  outline-offset: -2px;
  touch-action: none;
}
.pk-cs-win:focus-visible { outline: 3px solid var(--accent-main); outline-offset: -3px; }

/*
 * Everything outside the box, dimmed — the half of this control that shows
 * what is being thrown away.
 *
 * An enormous outline rather than the usual enormous box-shadow, because
 * globals.css strips box-shadow site-wide with !important for the flat look,
 * and a dimming shadow written that way silently never paints: the stage
 * showed a plain undimmed picture with a thin rectangle drawn on it. outline
 * is untouched by that rule, spreads outwards the same way, and the frame's
 * overflow:hidden clips it exactly as before.
 */
.pk-cs-win::after {
  content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  outline: 9999px solid rgba(6,8,15,0.58);
}
.pk-cs-frame.is-busy .pk-cs-win { cursor: grabbing; }

.pk-cs-grid {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: 0.25; transition: opacity 0.2s ease;
  background-image:
    linear-gradient(to right, transparent 0 calc(33.333% - 1px), #fff 0 33.333%, transparent 0 calc(66.666% - 1px), #fff 0 66.666%, transparent 0),
    linear-gradient(to bottom, transparent 0 calc(33.333% - 1px), #fff 0 33.333%, transparent 0 calc(66.666% - 1px), #fff 0 66.666%, transparent 0);
}
.pk-cs-frame.is-busy .pk-cs-grid { opacity: 0.55; }

/* 20px of paint, a much larger target. The target grows *outwards* only —
   --in caps how far it reaches back into the box — because a narrow crop on
   a phone is barely wider than four symmetrical hit areas, and four handles
   that meet in the middle leave nothing to drag the window by. */
.pk-cs-handle { --out: 18px; --in: 6px; position: absolute; z-index: 2; width: 20px; height: 20px; touch-action: none; }
.pk-cs-handle::after { content: ''; position: absolute; inset: 0; border: 3px solid #fff; border-radius: 3px; }
.pk-cs-handle.is-nw { top: -2px; left: -2px; cursor: nwse-resize; }
.pk-cs-handle.is-nw::after { border-right: 0; border-bottom: 0; }
.pk-cs-handle.is-nw::before { content: ''; position: absolute; inset: calc(var(--out) * -1) calc(var(--in) * -1) calc(var(--in) * -1) calc(var(--out) * -1); }
.pk-cs-handle.is-ne { top: -2px; right: -2px; cursor: nesw-resize; }
.pk-cs-handle.is-ne::after { border-left: 0; border-bottom: 0; }
.pk-cs-handle.is-ne::before { content: ''; position: absolute; inset: calc(var(--out) * -1) calc(var(--out) * -1) calc(var(--in) * -1) calc(var(--in) * -1); }
.pk-cs-handle.is-se { bottom: -2px; right: -2px; cursor: nwse-resize; }
.pk-cs-handle.is-se::after { border-left: 0; border-top: 0; }
.pk-cs-handle.is-se::before { content: ''; position: absolute; inset: calc(var(--in) * -1) calc(var(--out) * -1) calc(var(--out) * -1) calc(var(--in) * -1); }
.pk-cs-handle.is-sw { bottom: -2px; left: -2px; cursor: nesw-resize; }
.pk-cs-handle.is-sw::after { border-right: 0; border-top: 0; }
.pk-cs-handle.is-sw::before { content: ''; position: absolute; inset: calc(var(--in) * -1) calc(var(--in) * -1) calc(var(--out) * -1) calc(var(--out) * -1); }

/* ── The zoom instrument ─────────────────────────────────────────────────
   A range input still does the work — it is the only control that arrives
   with drag, keyboard, touch and a screen-reader value already correct — but
   it is invisible on top, and the parts below it paint something a plain
   slider cannot: where the crop stops being big enough for the file you asked
   for. Everything is placed off the same expression the browser uses for the
   thumb, so the paint and the hit target cannot drift apart. */
.pk-cs-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px;
  padding: 9px 12px; border-radius: 16px;
  background: var(--surface-1); border: 1px solid var(--border-color);
}
.pk-cs-controls { display: flex; align-items: center; gap: 10px; flex: 1 1 250px; min-width: 0; }
.pk-cs-meter { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: auto; }

.pk-cs-step {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 34px; height: 34px; cursor: pointer;
  border-radius: 50%; border: 1px solid var(--border-color);
  background: var(--surface-0); color: var(--text-main);
  transition: border-color 0.18s ease, color 0.18s ease;
}
.pk-cs-step:hover { border-color: var(--accent-main); color: var(--accent-main); }

.pk-cs-slider {
  --knob: 16px;
  /* Where a value sits, in the browser's own geometry: the travel is the track
     minus one knob, and the knob's centre is half a knob further on. Both are
     resolved against the slider, so every painted part lines up with the
     invisible thumb and with each other. */
  --fill-x: calc(var(--knob) / 2 + var(--pct) * (100% - var(--knob)) / 100);
  --safe-x: calc(var(--knob) / 2 + var(--safe) * (100% - var(--knob)) / 100);
  --caution: #a8730a;
  position: relative; flex: 1; min-width: 0; height: 34px;
  display: flex; align-items: center;
}

.pk-cs-slider input {
  position: absolute; inset: 0; width: 100%; height: 100%; margin: 0;
  opacity: 0; cursor: pointer; -webkit-appearance: none; appearance: none; background: transparent;
}
/* Sized to match the painted knob, or the value under the pointer would not
   be the value under the circle. */
.pk-cs-slider input::-webkit-slider-thumb { -webkit-appearance: none; width: var(--knob); height: var(--knob); }
.pk-cs-slider input::-moz-range-thumb { width: var(--knob); height: var(--knob); border: 0; }

.pk-cs-rail, .pk-cs-fill, .pk-cs-over, .pk-cs-tick, .pk-cs-limit, .pk-cs-knob {
  pointer-events: none; position: absolute; top: 50%; translate: 0 -50%;
}

.pk-cs-rail { left: 0; right: 0; height: 8px; border-radius: 99px; background: var(--surface-3); overflow: hidden; }

/* The zone the crop cannot fill, hatched before the thumb ever reaches it —
   so the limit is something you steer around rather than something you are
   told off for afterwards. */
.pk-cs-slider.has-limit .pk-cs-rail::after {
  content: ''; position: absolute; top: 0; bottom: 0; right: 0; left: var(--safe-x);
  background: repeating-linear-gradient(-45deg,
    rgba(168,115,10,0.16) 0 3px, rgba(168,115,10,0.05) 3px 6px);
}

/*
 * Two segments, not one bar that changes colour.
 *
 * The site's accent is red, so red cannot also mean "too far" — it is what
 * every button on the page already looks like. The filled track stays the
 * brand's red for as long as the crop is big enough, and the part beyond the
 * limit is hatched instead: a different texture rather than a different hue,
 * which reads at a glance and survives being colour-blind or on a bad screen.
 */
.pk-cs-fill {
  left: 0; height: 8px; border-radius: 99px;
  width: min(var(--fill-x), var(--safe-x));
  background: var(--accent-main);
}
.pk-cs-over {
  left: var(--safe-x); height: 8px; border-radius: 99px;
  width: max(0px, calc(var(--fill-x) - var(--safe-x)));
  background: repeating-linear-gradient(-45deg,
    var(--caution) 0 3px, #c99433 3px 6px);
}

/* Whole-number stops, printed under the rail like a ruler rather than on it. */
.pk-cs-tick {
  left: calc(var(--knob) / 2 + var(--at) * (100% - var(--knob)) / 100);
  top: calc(50% + 7px); translate: -50% 0;
  width: 1px; height: 4px; border-radius: 1px;
  background: var(--text-main); opacity: 0.28;
}

/* The line the whole control exists to draw. The halo is what keeps it legible
   whether it lands on bare track or on the filled red. */
.pk-cs-limit {
  left: var(--safe-x); translate: -50% -50%;
  width: 6px; height: 18px; border-radius: 2px;
  /* Its own halo, painted rather than cast: box-shadow is stripped site-wide. */
  background: linear-gradient(90deg,
    var(--surface-1) 0 2px, #2c313d 2px 4px, var(--surface-1) 4px 6px);
}

.pk-cs-knob {
  left: calc(var(--pct) * (100% - var(--knob)) / 100);
  width: var(--knob); height: var(--knob); border-radius: 50%;
  background: #fff; border: 3px solid var(--accent-main);
  transition: border-color 0.18s ease, outline-color 0.15s ease;
}
.pk-cs-slider.is-past .pk-cs-knob { border-color: var(--caution); }
/* A solid ring, not the 12%-alpha glow token: this is the only thing telling
   a keyboard user where they are, and at that opacity it was invisible. */
.pk-cs-slider:focus-within .pk-cs-knob { outline: 3px solid var(--accent-main); outline-offset: 2px; }
.pk-cs-slider.is-past:focus-within .pk-cs-knob { outline-color: var(--caution); }

/* Tabular figures so the number does not shuffle sideways while it counts. */
.pk-cs-zoom {
  font-size: 0.92rem; font-weight: 800; color: var(--text-main);
  font-variant-numeric: tabular-nums; letter-spacing: -0.2px;
}
.pk-cs-zoom em { font-style: normal; font-weight: 700; opacity: 0.42; margin-left: 1px; }
.pk-cs-zoom.is-past { color: #a8730a; }

.pk-cs-readout {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.pk-cs-readout::before { content: '·'; opacity: 0.45; }

.pk-cs-reset {
  /* justify-content matters once the label is hidden on a phone: without it
     the lone icon sits against the left edge of its circle while the stepper
     buttons beside it are centred. */
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; cursor: pointer; flex-shrink: 0;
  height: 34px; padding: 0 13px; border-radius: 30px;
  border: 1px solid var(--border-color); background: var(--surface-0);
  font-size: 0.76rem; font-weight: 700; color: var(--text-main);
  transition: border-color 0.18s ease, color 0.18s ease;
}
.pk-cs-reset:hover { border-color: var(--accent-main); color: var(--accent-main); }

@media (max-width: 560px) {
  /* The stage stays inside the page gutter like everything else. It used to
     break out of it for a few more pixels of crop precision, which cost the
     one thing worth more than precision here: the image lining up with the
     header above it and the panel below. */
  .pk-cs-frame { border-radius: 12px; }
  .pk-cs-handle { width: 24px; height: 24px; --out: 20px; }
  /* Thumb-sized targets, and a fatter track to drag them along. */
  .pk-cs-step { width: 40px; height: 40px; }
  .pk-cs-slider { --knob: 20px; height: 40px; }
  .pk-cs-rail, .pk-cs-fill, .pk-cs-over { height: 9px; }
  /* Icon only: the row is 319px wide and every pixel the word gives back is a
     pixel of slider travel. */
  .pk-cs-reset { width: 40px; height: 40px; padding: 0; border-radius: 50%; }
  .pk-cs-reset span { display: none; }
  /* Readout, not a second row of buttons — so the wrap costs a line of text
     rather than another 40px of chrome above the fold. */
  .pk-cs-meter { margin-left: 0; width: 100%; gap: 8px; }
}
`;

const previewStyles = `
.pk-cs-prev {
  position: relative; overflow: hidden; margin: 0;
  border-radius: 12px; background: var(--surface-2);
  border: 1px solid var(--border-color);
}
.pk-cs-prev img { position: absolute; height: auto; max-width: none; display: block; }
.pk-cs-prev figcaption {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 6px 8px;
  font-size: 0.58rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;
  color: #fff; background: linear-gradient(transparent, rgba(0,0,0,0.75));
}
`;
