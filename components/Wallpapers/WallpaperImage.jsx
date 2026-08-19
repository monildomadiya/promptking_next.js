import React from 'react';
import { cropUrl, cropSrcSet } from '@/lib/wallpaperUrls';

/**
 * One image element for every wallpaper thumbnail on the site.
 *
 * It exists so the three places that show a wallpaper — the grid, the home
 * strip and the "more wallpapers" rail — cannot drift apart on the details
 * that decide page weight: the crop, the quality step, the candidate widths
 * and the `sizes` hint.
 *
 * AVIF is offered explicitly rather than left to `f_auto`. On this account
 * `f_auto` answers WebP even to a browser that advertises AVIF, and the same
 * crop in AVIF is about a third smaller. A <picture> asks for AVIF where it is
 * supported and falls back to whatever `f_auto` decides everywhere else, so no
 * browser is handed a format it cannot decode.
 */
export default function WallpaperImage({
  image,
  alt = '',
  widths = [240, 480, 720],
  sizes,
  ratio = '3:4',
  quality = 'eco',
  priority = false,
  className,
  ...rest
}) {
  const src = cropUrl(image, { width: widths[Math.floor(widths.length / 2)], ratio, quality });
  const srcSet = cropSrcSet(image, widths, { ratio, quality });
  const avifSet = cropSrcSet(image, widths, { ratio, quality, format: 'avif' });

  // A non-Cloudinary source has no variants to offer; render it plainly rather
  // than emitting a srcset of identical URLs.
  if (!srcSet) {
    return <img src={image} alt={alt} className={className} loading={priority ? 'eager' : 'lazy'} decoding="async" {...rest} />;
  }

  return (
    <picture>
      <source type="image/avif" srcSet={avifSet} sizes={sizes} />
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        {...rest}
      />
    </picture>
  );
}
