import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ================================================================== */
/*  CloudScrollTop — airplane scroll-to-top with cloud rush effect     */
/*                                                                     */
/*  When clicked:                                                      */
/*  1. Full-screen cloud overlay appears                               */
/*  2. Clouds rush upward rapidly                                      */
/*  3. Page scrolls to top                                             */
/*  4. Clouds fade out                                                 */
/* ================================================================== */

const CLOUD_CSS = `
  @keyframes cloudRushUp {
    0%   { transform: translateY(100vh); opacity: 0; }
    20%  { opacity: 0.8; }
    80%  { opacity: 0.6; }
    100% { transform: translateY(-100vh); opacity: 0; }
  }
  @keyframes planeAscend {
    0%   { transform: translateY(0) scale(1); }
    50%  { transform: translateY(-20px) scale(1.15); }
    100% { transform: translateY(-60px) scale(0.8); opacity: 0; }
  }
  @keyframes cloudOverlayFade {
    0%   { opacity: 1; }
    100% { opacity: 0; pointer-events: none; }
  }
  .cloud-rush-overlay {
    animation: cloudOverlayFade 0.3s ease-out 0.7s forwards;
  }
  .cloud-rush-item {
    animation: cloudRushUp 0.8s ease-out forwards;
  }
  .plane-ascend-btn {
    animation: planeAscend 0.6s ease-in forwards;
  }
  @media (prefers-reduced-motion: reduce) {
    .cloud-rush-overlay, .cloud-rush-item, .plane-ascend-btn {
      animation: none !important;
    }
  }
`;

const CloudScrollTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (!styleRef.current) {
      const s = document.createElement('style');
      s.id = 'cloud-scroll-style';
      s.textContent = CLOUD_CSS;
      document.head.appendChild(s);
      styleRef.current = s;
    }
    return () => { styleRef.current?.remove(); styleRef.current = null; };
  }, []);

  const handleClick = useCallback(() => {
    if (animating) return;
    setAnimating(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => setAnimating(false), 1000);
  }, [animating]);

  if (!visible && !animating) return null;

  return (
    <>
      {/* Cloud rush overlay */}
      {animating && (
        <div className="fixed inset-0 z-[90] pointer-events-none cloud-rush-overlay">
          {[...Array(12)].map((_, i) => (
            <div key={i}
              className="absolute cloud-rush-item"
              style={{
                width: `${100 + Math.random() * 250}px`,
                height: `${30 + Math.random() * 50}px`,
                left: `${Math.random() * 100}%`,
                bottom: `${Math.random() * -20}%`,
                background: `radial-gradient(ellipse, rgba(255,255,255,${0.6 + Math.random() * 0.3}) 0%, transparent 70%)`,
                borderRadius: '50%',
                animationDelay: `${i * 50}ms`,
                animationDuration: `${0.6 + Math.random() * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Airplane button */}
      <button
        onClick={handleClick}
        className={`fixed bottom-6 right-6 z-[85] w-12 h-12 rounded-full
                    bg-sky-600 dark:bg-sky-500 text-white
                    shadow-xl shadow-sky-600/30 dark:shadow-sky-500/30
                    hover:bg-sky-700 dark:hover:bg-sky-600 hover:shadow-2xl hover:scale-110
                    transition-all duration-300
                    flex items-center justify-center
                    ${animating ? 'plane-ascend-btn' : ''}
                    ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Scroll to top"
        style={{ transition: 'opacity 0.3s, transform 0.3s, background-color 0.2s, box-shadow 0.2s' }}>
        <svg className="w-5 h-5 -rotate-45" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </button>
    </>
  );
};

export default CloudScrollTop;
