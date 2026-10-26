import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop Component
 *
 * Centralized scroll restoration for PoultryPro:
 * 1. Automatically resets scroll to (0, 0) instantly on route changes (PUSH / REPLACE).
 * 2. Respects URL hash anchors (e.g. #pricing, #faq, #acceptance) and smoothly scrolls to the target element.
 * 3. Preserves / restores previous scroll positions for browser Back / Forward history navigation (POP).
 * 4. Resets custom scroll containers (e.g. Farmer MainLayout <main.overflow-y-auto>).
 * 5. Does NOT trigger on modal toggles, dropdowns, form submissions, or query parameter updates.
 */
export default function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();
  const scrollPositionsRef = useRef(new Map());
  const prevPathnameRef = useRef(location.pathname);

  // Configure browser scrollRestoration to manual so our custom logic has full authority
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      const original = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      return () => {
        window.history.scrollRestoration = original;
      };
    }
  }, []);

  // Track the scroll position of the current page for history restoration
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        scrollPositionsRef.current.set(location.key, {
          x: window.scrollX || window.pageXOffset || 0,
          y: window.scrollY || window.pageYOffset || 0,
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.key]);

  // Handle route and hash navigation
  useEffect(() => {
    const isNewPathname = prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;

    // Helper to reset custom scrollable containers (like MainLayout's <main>)
    const resetScrollContainers = () => {
      const containers = document.querySelectorAll(
        '.farmer-workspace main, main.overflow-y-auto, [data-scroll-container]'
      );
      containers.forEach((container) => {
        container.scrollTop = 0;
      });
    };

    // Helper to scroll window instantly to top
    const scrollToTopInstant = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      resetScrollContainers();
    };

    // Case 1: URL contains a valid hash anchor (e.g. #faq, #pricing, #introduction)
    if (location.hash) {
      const targetId = location.hash.replace(/^#/, '');
      const scrollTarget = () => {
        const el = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
        return false;
      };

      if (!scrollTarget()) {
        // Element might not be in DOM yet if page component is mounting; retry after a tick
        const timeout = setTimeout(scrollTarget, 80);
        return () => clearTimeout(timeout);
      }
      return;
    }

    // Case 2: Browser Back / Forward navigation (POP)
    if (navType === 'POP' && scrollPositionsRef.current.has(location.key)) {
      const saved = scrollPositionsRef.current.get(location.key);
      if (saved) {
        window.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
        return;
      }
    }

    // Case 3: Standard new route navigation (PUSH / REPLACE) or POP without saved position
    if (isNewPathname || navType === 'PUSH') {
      scrollToTopInstant();
      // Double-check on next animation frame in case layout calculates dimensions after render
      const frameId = requestAnimationFrame(scrollToTopInstant);
      return () => cancelAnimationFrame(frameId);
    }
  }, [location.pathname, location.hash, location.key, navType]);

  return null;
}
