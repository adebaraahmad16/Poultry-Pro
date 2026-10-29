import React from 'react';
import { Plus } from './Icons';

/**
 * Mobile-Friendly Sticky Record Button
 *
 * Appears on smartphones and tablets (screens < md) as a floating quick-action
 * button to make recording farm activities instantaneous without scrolling.
 * Automatically disappears when a modal/form is open so it never overlaps inputs.
 */
export default function StickyRecordButton({
  onClick,
  label = 'Record',
  icon: Icon = Plus,
  color = 'bg-emerald-600 hover:bg-emerald-700',
  isModalOpen = false,
  className = ''
}) {
  if (isModalOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`md:hidden fixed bottom-6 right-5 z-30 flex items-center gap-2 px-4 py-3 rounded-full text-white font-bold text-xs shadow-xl active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/30 ${color} ${className}`}
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <Icon className="w-4 h-4 stroke-[2.5]" />
      <span>{label}</span>
    </button>
  );
}
