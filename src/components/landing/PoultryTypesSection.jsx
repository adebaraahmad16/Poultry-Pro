import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bird, ArrowRight } from '../common/Icons';
import { POULTRY_TYPES } from '../../constants/poultryTypes';

export const POULTRY_SLIDES = [
  {
    id: 'broilers',
    name: 'Broilers',
    alt: 'Commercial broiler chickens in a farm environment',
  },
  {
    id: 'layers',
    name: 'Layers',
    alt: 'Free-range egg-laying hens on a poultry farm',
  },
  {
    id: 'cockerels',
    name: 'Cockerels',
    alt: 'Cockerel rooster in a farmyard poultry setting',
  },
  {
    id: 'turkeys',
    name: 'Turkeys',
    alt: 'Flock of domestic turkeys on farm pasture',
  },
  {
    id: 'ducks',
    name: 'Ducks',
    alt: 'Flock of domestic ducks on a poultry farm',
  },
];

export default function PoultryTypesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef(null);

  const goToSlide = (nextIndex) => {
    if (nextIndex === currentIndex) return;
    setPrevIndex(currentIndex);
    setCurrentIndex(nextIndex);
  };

  // Pause transitions when section is not visible
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(section);

    const handleVisibility = () => {
      if (document.hidden) {
        setIsInView(false);
      } else if (section) {
        const rect = section.getBoundingClientRect();
        const visible = rect.top < window.innerHeight && rect.bottom > 0;
        setIsInView(visible);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      observer.unobserve(section);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Preload next slide image to avoid delay
  useEffect(() => {
    const nextIdx = (currentIndex + 1) % POULTRY_SLIDES.length;
    const nextSlide = POULTRY_SLIDES[nextIdx];
    const img = new Image();
    img.src = `/images/poultry/${nextSlide.id}.jpg`;
  }, [currentIndex]);

  // Automatic slideshow transition every 5 seconds
  useEffect(() => {
    if (!isInView) return;

    const mediaQuery = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (mediaQuery && mediaQuery.matches) return;

    const timer = setInterval(() => {
      setCurrentIndex((curr) => {
        setPrevIndex(curr);
        return (curr + 1) % POULTRY_SLIDES.length;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isInView, currentIndex]);

  return (
    <section
      id="poultry-types"
      ref={sectionRef}
      className="relative isolate overflow-hidden border-t border-slate-200/60 py-16 sm:py-20"
    >
      {/* 1. Full-width Background Slideshow (moving transition, zero overlays) */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)`, willChange: 'transform' }}
        >
          {POULTRY_SLIDES.map((slide, index) => (
            <div key={slide.id} className="relative h-full w-full shrink-0">
              <picture className="absolute inset-0 block w-full h-full">
                <source
                  type="image/webp"
                  srcSet={`/images/poultry/${slide.id}-768.webp 768w, /images/poultry/${slide.id}-1600.webp 1600w`}
                  sizes="100vw"
                />
                <img
                  src={`/images/poultry/${slide.id}.jpg`}
                  alt={slide.alt}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchpriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className="h-full w-full object-cover object-center"
                />
              </picture>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Section Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* High-visibility frosted heading plate */}
        <div className="text-center max-w-3xl mx-auto">
          <span
            className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-300 mb-3"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9)' }}
          >
            Personalized for you
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 4px 14px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.95)' }}
          >
            Built Around the Poultry You Raise
          </h2>
          <p
            className="mt-3 text-base sm:text-lg font-semibold leading-relaxed text-white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.95)' }}
          >
            Whether you raise broilers, layers, turkeys or ducks, PoultryPro adapts to your operation.
          </p>
        </div>

        {/* Existing Poultry Type Cards with high-contrast solid backgrounds */}
        <div className="mt-10 grid grid-cols-1 auto-rows-fr md:grid-cols-2 lg:grid-cols-4 gap-6">
          {POULTRY_TYPES.filter((t) => t.id !== 'quails').map((t) => {
            const Icon = Bird;
            return (
              <div
                key={t.id}
                data-poultry-type={t.id}
                className="flex h-full min-w-0 flex-col items-center rounded-2xl border border-slate-200/90 bg-white/95 p-6 text-center shadow-lg transition-all hover:shadow-xl hover:bg-white"
              >
                <div
                  className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs"
                  aria-hidden="true"
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900">{t.label}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{t.description}</p>
              </div>
            );
          })}
        </div>

        {/* 3. Transition Indicators */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div
            className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5"
            role="tablist"
            aria-label="Poultry background slideshow navigation"
          >
            {POULTRY_SLIDES.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`View ${slide.name} background`}
                  onClick={() => goToSlide(index)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer ${
                    isActive
                      ? 'bg-[#15803D] text-white shadow-md ring-2 ring-white/90 scale-105'
                      : 'text-white hover:text-white'
                  }`}
                >
                  <span
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'w-2 bg-emerald-300 shadow-sm' : 'w-2 bg-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
                    }`}
                    aria-hidden="true"
                  />
                  <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9)' }}>{slide.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Action Button */}
        <div className="mt-8 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#15803D] hover:bg-green-800 text-white font-bold text-sm rounded-2xl shadow-xl shadow-black/30 transition-all hover:scale-[1.02]"
          >
            Explore Poultry Management
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
