import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const positions = new Map();
export default function useSidebarScroll(scope) {
  const ref = useRef(null);
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollTop = positions.get(scope) || 0;
    const remember = () => positions.set(scope, element.scrollTop);
    element.addEventListener('scroll', remember, { passive: true });
    return () => { remember(); element.removeEventListener('scroll', remember); };
  }, [scope, pathname]);
  return ref;
}
