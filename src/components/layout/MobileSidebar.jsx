import React, { useEffect } from 'react';
import { X } from '../common/Icons';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MobileSidebar({ isOpen, onClose }) {
  const location=useLocation();
  useEffect(()=>{onClose();},[location.pathname]);
  useEffect(()=>{if(!isOpen)return;const close=e=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[isOpen,onClose]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Farmer navigation">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Slide-over Content */}
      <div className="fixed inset-y-0 left-0 h-dvh w-72 max-w-[85vw] bg-slate-900 shadow-2xl flex flex-col z-50" onClick={e=>{if(e.target.closest('a'))onClose();}}>
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
        <Sidebar className="w-full border-r-0" />
      </div>
    </div>
  );
}
