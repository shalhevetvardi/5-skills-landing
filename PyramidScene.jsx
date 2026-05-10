import { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────
   Keyframes injected once into the document head.
   Avoids styled-components / emotion dependency.
───────────────────────────────────────────── */
const KEYFRAMES = `
  @keyframes pyramidGlowPulse {
    0%   { transform: scale(0.8); opacity: 0.6; }
    50%  { transform: scale(1.2); opacity: 1;   }
    100% { transform: scale(0.8); opacity: 0.6; }
  }
  @keyframes pyramidDriftDown {
    0%   { transform: translateY(-2%); }
    100% { transform: translateY(4%);  }
  }
  @keyframes pyramidMedallionSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

function injectKeyframes() {
  if (document.getElementById('pyramid-scene-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'pyramid-scene-keyframes';
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────
   Helpers — identical to the HTML version
───────────────────────────────────────────── */
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const rangeProgress = (value, start, end) =>
  clamp01((value - start) / (end - start));
const medallionBrightness = (progress, threshold) =>
  0.3 + 1.2 * rangeProgress(progress, threshold, 1);

/* ─────────────────────────────────────────────
   Shared base style for every layer
───────────────────────────────────────────── */
const BASE = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  pointerEvents: 'none',
  transformOrigin: 'center center',
  willChange: 'transform, opacity, filter',
};

/* ─────────────────────────────────────────────
   PyramidScene
   Props:
     imgPath  — prefix for all image paths, default './'
     height   — total scroll height, default '400vh'
───────────────────────────────────────────── */
export default function PyramidScene({ imgPath = './', height = '400vh' }) {
  const [scroll, setScroll] = useState(0);
  const [beam, setBeam] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    injectKeyframes();

    const update = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const sp = maxScroll > 0 ? clamp01(window.scrollY / maxScroll) : 0;
      setScroll(sp);
      setBeam(rangeProgress(sp, 0.2, 0.6));
      rafRef.current = null;
    };

    const onScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const src = (name) => `${imgPath}${name}`;

  /* Medallion thresholds — 6 staggered activation points */
  const MEDALLION_THRESHOLDS = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85];

  return (
    <div style={{ position: 'relative', height }}>

      {/* ── Sticky viewport ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          perspective: '1200px',
          background: '#060b1a',
        }}
      >
        {/* Scroll hint */}
        <p
          style={{
            position: 'absolute',
            top: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            margin: 0,
            color: '#fff',
            opacity: Math.max(0, 1 - scroll * 4),
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.78rem',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, Arial, sans-serif',
            pointerEvents: 'none',
          }}
        >
          Scroll to awaken the crystal
        </p>

        {/* Layer stack */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
          }}
        >

          {/* 1 — bg_solid: static */}
          <img src={src('bg_solid.png')} alt="" style={{ ...BASE, zIndex: 1 }} />

          {/* 2 — bg_galaxy: parallax upward */}
          <img
            src={src('bg_galaxy.png')}
            alt=""
            style={{
              ...BASE,
              zIndex: 2,
              transform: `translateY(${scroll * -30}px)`,
            }}
          />

          {/* 3 — pyramid: subtle Y-axis 3-D tilt */}
          <img
            src={src('pyramid.png')}
            alt=""
            style={{
              ...BASE,
              zIndex: 3,
              transform: `rotateY(${scroll * 8}deg)`,
            }}
          />

          {/* 4 — gold_drips: fade in 0→40%, drift down */}
          <img
            src={src('gold_drips.png')}
            alt=""
            style={{
              ...BASE,
              zIndex: 4,
              opacity: clamp01(scroll / 0.4),
              transform: `translateY(${scroll * 20}px)`,
            }}
          />

          {/* 5 — medallions: one copy per medallion, brightness staggered */}
          {MEDALLION_THRESHOLDS.map((threshold, i) => (
            <img
              key={i}
              src={src('medallions.png')}
              alt=""
              style={{
                ...BASE,
                zIndex: 5,
                mixBlendMode: 'screen',
                filter: `brightness(${medallionBrightness(scroll, threshold)})`,
                animation: `pyramidMedallionSpin ${18 + i * 3}s linear infinite`,
              }}
            />
          ))}

          {/* 6 — beam: slides in from right between 20%–60% scroll */}
          <img
            src={src('beam.png')}
            alt=""
            style={{
              ...BASE,
              zIndex: 6,
              opacity: beam,
              transform: `translateX(${(1 - beam) * 800}px)`,
            }}
          />

          {/* 7 — glow: continuous pulse + scale grows with scroll */}
          <div
            style={{
              ...BASE,
              zIndex: 7,
              display: 'grid',
              placeItems: 'center',
              transform: `scale(${1 + scroll * 0.7})`,
            }}
          >
            <img
              src={src('glow.png')}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.8,
                animation: 'pyramidGlowPulse 1.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* 8 — particles: CSS-generated gold sparkles, drift down forever */}
          <div
            aria-hidden="true"
            style={{
              ...BASE,
              zIndex: 8,
              background: [
                'radial-gradient(circle at 10% 15%, rgba(255,215,120,0.9) 0 1px,  transparent 1.2px)',
                'radial-gradient(circle at 22% 45%, rgba(255,215,120,0.8) 0 1.2px, transparent 1.5px)',
                'radial-gradient(circle at 38% 24%, rgba(255,223,150,0.9) 0 1px,  transparent 1.3px)',
                'radial-gradient(circle at 52% 56%, rgba(255,215,120,0.75) 0 1.3px,transparent 1.6px)',
                'radial-gradient(circle at 66% 34%, rgba(255,223,150,0.85) 0 1px,  transparent 1.3px)',
                'radial-gradient(circle at 81% 62%, rgba(255,215,120,0.8) 0 1.2px, transparent 1.5px)',
                'radial-gradient(circle at 92% 18%, rgba(255,223,150,0.85) 0 1px,  transparent 1.2px)',
              ].join(', '),
              backgroundRepeat: 'repeat',
              backgroundSize: '320px 320px',
              mixBlendMode: 'screen',
              opacity: 0.72,
              animation: 'pyramidDriftDown 9s linear infinite',
            }}
          />

        </div>
      </div>
    </div>
  );
}
