import React, { useEffect, useState } from 'react';

export default function ProfileAvatar({ src, name = 'Farmer', className = 'h-12 w-12', alt = 'Profile picture' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const initials = name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase() || 'F';
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 font-semibold text-emerald-800 ring-1 ring-emerald-200 ${className}`}>
    {src && !failed ? <img key={src} src={src} alt={alt} className="h-full w-full object-cover" onError={()=>setFailed(true)} /> : <span role="img" aria-label={`${name || 'Farmer'} default avatar`}>{initials}</span>}
  </span>;
}
