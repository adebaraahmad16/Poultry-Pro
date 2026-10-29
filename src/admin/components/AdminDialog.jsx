import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from '../../components/common/Icons';
import useAdminDialog from './useAdminDialog';

export default function AdminDialog({ children, onClose, className = '', title = 'Administrator details' }) {
  const ref = useRef(null);
  useAdminDialog(true, onClose, ref);
  const panel = React.Children.only(children);
  const content = React.Children.toArray(panel.props.children);
  const first = content[0];
  const headingOf = node => !React.isValidElement(node) ? null : ['h1', 'h2', 'h3'].includes(node.type) ? node : React.Children.toArray(node.props.children).map(headingOf).find(Boolean);
  const textOf = node => typeof node === 'string' || typeof node === 'number' ? String(node) : React.isValidElement(node) ? React.Children.toArray(node.props.children).map(textOf).join(' ') : '';
  const hasButton = node => React.isValidElement(node) && (node.type === 'button' || React.Children.toArray(node.props.children).some(hasButton));
  const labelClose = node => !React.isValidElement(node) ? node : React.cloneElement(node, {
    ...(node.type === 'button' ? { 'aria-label': node.props['aria-label'] || 'Close dialog' } : {}),
    ...(node.props.children ? { children: React.Children.map(node.props.children, labelClose) } : {}),
  });
  const heading = React.isValidElement(first) && ['h2', 'h3'].includes(first.type);
  const header = hasButton(first)
    ? React.cloneElement(labelClose(first), { className: `admin-dialog-header ${first.props.className || ''}` })
    : <div className="admin-dialog-header flex items-center justify-between gap-3">{heading ? first : <span className="font-bold">{title}</span>}<button type="button" aria-label="Close dialog" onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600"><X className="h-5 w-5" /></button></div>;
  return createPortal(<div className={`admin-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 ${className}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose?.(); }}>
    {React.cloneElement(panel, {
      ref, role: 'dialog', 'aria-modal': true, 'aria-label': panel.props['aria-label'] || textOf(headingOf(first)) || title, tabIndex: -1,
      className: `admin-dialog-panel ${panel.props.className || ''}`,
      children: <>{header}{hasButton(first) || heading ? content.slice(1) : content}</>,
    })}
  </div>, document.body);
}
