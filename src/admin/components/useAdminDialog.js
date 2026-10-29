import { useEffect, useRef } from 'react';

const dialogs = [];
let bodyOverflow;

export default function useAdminDialog(open, onClose, ref) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || !ref.current) return;
    const element = ref.current;
    const previous = document.activeElement;
    if (!dialogs.length) { bodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    dialogs.push(element);
    const focusable = () => [...element.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(node => node.getClientRects().length && !node.closest('[inert]'));
    (focusable()[0] || element).focus();
    const keydown = event => {
      if (dialogs.at(-1) !== element) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current?.(); }
      if (event.key === 'Tab') {
        const items = focusable();
        if (!items.length) { event.preventDefault(); element.focus(); return; }
        if (event.shiftKey && (document.activeElement === items[0] || !element.contains(document.activeElement))) { event.preventDefault(); items.at(-1).focus(); }
        else if (!event.shiftKey && (document.activeElement === items.at(-1) || !element.contains(document.activeElement))) { event.preventDefault(); items[0].focus(); }
      }
    };
    const containFocus = event => {
      if (dialogs.at(-1) === element && !element.contains(event.target)) (focusable()[0] || element).focus();
    };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('focusin', containFocus);
    return () => {
      dialogs.splice(dialogs.lastIndexOf(element), 1);
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('focusin', containFocus);
      if (!dialogs.length) document.body.style.overflow = bodyOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, ref]);
}
