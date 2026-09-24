import React from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MobileSidebar({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Slide-over Content */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 shadow-2xl flex flex-col z-50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
        <Sidebar className="w-full border-r-0" />
      </div>
    </div>
  );
}
