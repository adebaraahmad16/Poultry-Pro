import React from 'react';

/**
 * Dedicated responsive focal point configurations for each section photograph.
 * Prevents subjects (farmers, chicks, feeders) from being cropped out across breakpoints.
 */
const PHOTO_CONFIG = {
  hero: {
    width: 1600,
    height: 898,
    // Frames the chicken flock and hanging red feeders under warm brooder light
    positionClass: 'object-[center_45%] sm:object-[center_50%] lg:object-[center_55%]',
  },
  farmer: {
    width: 1600,
    height: 1200,
    // The Nigerian farmer in orange vest is on the left (X: 25-35%);
    // this keeps the farmer & brooding chicks prominently in view on mobile and desktop
    positionClass: 'object-[28%_20%] sm:object-[32%_35%] lg:object-[36%_40%]',
  },
  cta: {
    width: 1600,
    height: 1067,
    // The woman farmer holding a chicken is at top-left (X: 20-35%, Y: 20-40%);
    // keeps the farmer and her bird framed across narrow and wide screens
    positionClass: 'object-[26%_25%] sm:object-[30%_30%] lg:object-[35%_35%]',
  },
};

/**
 * SectionPhoto renders high-fidelity, responsive background imagery with:
 * - Crisp, uncompressed WebP sources with JPEG fallback
 * - Subject-aware responsive object-positioning per section
 * - Intrinsic dimensions to prevent layout shifts (CLS)
 * - Zero artificial darkening, color washes or gradient overlays
 * - Graceful fallback to solid section background on network error
 */
export default function SectionPhoto({ name, eager = false, className = '' }) {
  const config = PHOTO_CONFIG[name] || {
    width: 1600,
    height: 1067,
    positionClass: 'object-center',
  };

  const imageClasses = `h-full w-full object-cover select-none pointer-events-none ${config.positionClass} ${className}`;

  return (
    <picture className="absolute inset-0 -z-10 block h-full w-full overflow-hidden pointer-events-none" aria-hidden="true">
      <source
        type="image/webp"
        srcSet={`/images/poultry/${name}-768.webp 768w, /images/poultry/${name}-1600.webp 1600w`}
        sizes="100vw"
      />
      <img
        src={`/images/poultry/${name}.jpg`}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        fetchpriority={eager ? 'high' : 'auto'}
        decoding={eager ? 'sync' : 'async'}
        width={config.width}
        height={config.height}
        className={imageClasses}
        style={{
          imageRendering: 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
        onError={(event) => {
          const image = event.currentTarget;
          if (image.dataset.fallbackAttempted) {
            image.style.visibility = 'hidden';
            return;
          }
          image.dataset.fallbackAttempted = 'true';
          image.parentElement?.querySelectorAll('source').forEach((source) => {
            source.media = 'not all';
          });
          image.src = `/images/poultry/${name}.jpg`;
        }}
      />
    </picture>
  );
}
