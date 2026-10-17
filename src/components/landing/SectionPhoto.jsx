import React from 'react';

// Solid section colours remain visible if a background image cannot load.
export default function SectionPhoto({ name, eager = false }) {
 return <picture className="absolute inset-0 -z-10 block" aria-hidden="true">
  <source type="image/webp" srcSet={`/images/poultry/${name}-768.webp 768w, /images/poultry/${name}-1600.webp 1600w`} sizes="100vw" />
  <img src={`/images/poultry/${name}.jpg`} alt="" loading={eager ? 'eager' : 'lazy'} fetchpriority={eager ? 'high' : 'auto'} decoding="async" width="1600" height="1067" className="h-full w-full object-cover object-center" onError={event => {
   const image = event.currentTarget;
   if (image.dataset.fallbackAttempted) { image.style.visibility = 'hidden'; return; }
   image.dataset.fallbackAttempted = 'true';
   image.parentElement.querySelectorAll('source').forEach(source => { source.media = 'not all'; });
   image.src = `/images/poultry/${name}.jpg`;
  }} />
 </picture>;
}
