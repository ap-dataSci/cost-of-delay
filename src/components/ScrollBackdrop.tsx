"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed-position decorative backdrop layered behind the entire page. Reads
 * scroll position via rAF and writes it to CSS custom properties on the root
 * element, so motion is driven by transforms (compositor-friendly) rather
 * than React state. Pure decoration — pointer-events disabled, aria-hidden.
 *
 * Layers, back-to-front:
 *   1. Aurora — slow gradient sweep across the top, parallax-shifted by scroll.
 *   2. Drifting orbs — emerald & copper bokeh that translate with scroll.
 *   3. Orbital rings — two faint dashed circles, slow CSS spin.
 *   4. Star/mote field — tiny twinkling dots scattered across the viewport.
 *   5. Vignette — subtle bottom darkening to weight the page.
 */
export default function ScrollBackdrop() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    let last = -1;

    const tick = () => {
      const doc = document.documentElement;
      const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(window.scrollY / max, 0), 1);
      if (Math.abs(p - last) > 0.0005) {
        // 0..1 scroll fraction
        el.style.setProperty("--sb-p", p.toFixed(4));
        // Parallax offsets (px) — each layer leans on a different multiplier.
        el.style.setProperty("--sb-y1", `${(-p * 240).toFixed(1)}px`);
        el.style.setProperty("--sb-y2", `${(p * 180).toFixed(1)}px`);
        el.style.setProperty("--sb-y3", `${(-p * 60).toFixed(1)}px`);
        // Hue rotation as we travel down — the page slowly cools toward emerald.
        el.style.setProperty("--sb-hue", `${(p * 40).toFixed(1)}deg`);
        last = p;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        // Initial values so styles work pre-rAF.
        // @ts-expect-error - CSS custom properties not in CSSProperties.
        "--sb-p": 0,
        "--sb-y1": "0px",
        "--sb-y2": "0px",
        "--sb-y3": "0px",
        "--sb-hue": "0deg",
      }}
    >
      {/* Aurora — emerald wash across top, parallax-shifted. */}
      <div
        className="absolute -top-40 left-0 right-0 h-[60vh] motion-safe:animate-aurora"
        style={{
          transform: "translate3d(0, var(--sb-y1), 0)",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(52,211,153,0.18), rgba(52,211,153,0) 70%)",
          filter: "blur(20px) hue-rotate(var(--sb-hue))",
        }}
      />

      {/* Copper warmth — bottom-right, slow drift, parallax-shifted. */}
      <div
        className="absolute -bottom-32 -right-32 h-[44rem] w-[44rem] rounded-full motion-safe:animate-drift-slow"
        style={{
          transform: "translate3d(0, var(--sb-y2), 0)",
          background:
            "radial-gradient(closest-side, rgba(245,158,11,0.14), rgba(245,158,11,0) 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Floating emerald orb — left side, drifts upward with scroll. */}
      <div
        className="absolute left-[-12rem] top-[40%] h-[32rem] w-[32rem] rounded-full motion-safe:animate-drift"
        style={{
          transform: "translate3d(0, var(--sb-y1), 0)",
          background:
            "radial-gradient(closest-side, rgba(16,185,129,0.16), rgba(16,185,129,0) 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Orbital rings — concentric dashed circles, slow CSS rotation. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: "translate3d(-50%, calc(-50% + var(--sb-y3)), 0)" }}
      >
        <svg
          width="1400"
          height="1400"
          viewBox="0 0 1400 1400"
          className="motion-safe:animate-orbit-slow opacity-[0.07]"
        >
          <circle
            cx="700"
            cy="700"
            r="500"
            fill="none"
            stroke="#f4ede1"
            strokeWidth="1"
            strokeDasharray="2 14"
          />
          <circle
            cx="700"
            cy="700"
            r="380"
            fill="none"
            stroke="#34d399"
            strokeWidth="1"
            strokeDasharray="1 22"
          />
        </svg>
      </div>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: "translate3d(-50%, calc(-50% + var(--sb-y3)), 0)" }}
      >
        <svg
          width="1600"
          height="1600"
          viewBox="0 0 1600 1600"
          className="motion-safe:animate-orbit-reverse opacity-[0.05]"
        >
          <circle
            cx="800"
            cy="800"
            r="660"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="1 28"
          />
        </svg>
      </div>

      {/* Star field — fixed positions, gentle twinkle, faint. */}
      <StarField />

      {/* Bottom vignette — pulls focus inward. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[40vh]"
        style={{
          background:
            "linear-gradient(to top, rgba(7,9,13,0.85), rgba(7,9,13,0))",
        }}
      />
    </div>
  );
}

/**
 * Deterministically-placed star/mote field. 36 dots, pseudo-random but stable
 * across renders, each with a randomized twinkle delay so they don't pulse in
 * sync.
 */
function StarField() {
  const stars = STAR_POSITIONS;
  return (
    <div className="absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[var(--color-ink)] motion-safe:animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r}px`,
            height: `${s.r}px`,
            opacity: s.o,
            animationDelay: `${s.d}s`,
            animationDuration: `${s.dur}s`,
            boxShadow: "0 0 8px rgba(244,237,225,0.4)",
          }}
        />
      ))}
    </div>
  );
}

// Stable star positions (chosen once, hard-coded for SSR/CSR parity).
const STAR_POSITIONS: { x: number; y: number; r: number; o: number; d: number; dur: number }[] = [
  { x: 4, y: 8, r: 1.4, o: 0.55, d: 0.2, dur: 4.2 },
  { x: 12, y: 22, r: 1, o: 0.45, d: 1.7, dur: 5.6 },
  { x: 18, y: 5, r: 1.6, o: 0.7, d: 3.0, dur: 4.8 },
  { x: 27, y: 14, r: 0.9, o: 0.4, d: 0.8, dur: 6.3 },
  { x: 33, y: 28, r: 1.2, o: 0.55, d: 2.6, dur: 5.1 },
  { x: 41, y: 9, r: 1.5, o: 0.6, d: 1.2, dur: 4.5 },
  { x: 48, y: 18, r: 0.8, o: 0.35, d: 3.4, dur: 6.8 },
  { x: 56, y: 6, r: 1.3, o: 0.65, d: 0.6, dur: 4.9 },
  { x: 63, y: 24, r: 1, o: 0.45, d: 2.1, dur: 5.4 },
  { x: 71, y: 11, r: 1.6, o: 0.7, d: 1.5, dur: 4.3 },
  { x: 79, y: 19, r: 0.9, o: 0.4, d: 3.7, dur: 6.1 },
  { x: 86, y: 7, r: 1.2, o: 0.55, d: 0.9, dur: 5.0 },
  { x: 92, y: 21, r: 1.4, o: 0.6, d: 2.3, dur: 4.7 },
  { x: 8, y: 38, r: 1.1, o: 0.5, d: 1.4, dur: 5.5 },
  { x: 22, y: 44, r: 1.5, o: 0.65, d: 3.1, dur: 4.6 },
  { x: 36, y: 52, r: 0.9, o: 0.4, d: 0.5, dur: 6.0 },
  { x: 49, y: 41, r: 1.3, o: 0.6, d: 2.7, dur: 4.4 },
  { x: 61, y: 48, r: 1, o: 0.45, d: 1.0, dur: 5.7 },
  { x: 74, y: 55, r: 1.6, o: 0.7, d: 3.5, dur: 4.8 },
  { x: 88, y: 42, r: 0.8, o: 0.35, d: 1.8, dur: 6.4 },
  { x: 5, y: 64, r: 1.2, o: 0.55, d: 2.4, dur: 5.2 },
  { x: 19, y: 72, r: 1.4, o: 0.6, d: 0.4, dur: 4.9 },
  { x: 32, y: 68, r: 0.9, o: 0.4, d: 2.9, dur: 6.2 },
  { x: 45, y: 76, r: 1.5, o: 0.65, d: 1.6, dur: 4.5 },
  { x: 58, y: 70, r: 1, o: 0.45, d: 3.2, dur: 5.6 },
  { x: 70, y: 78, r: 1.3, o: 0.55, d: 0.7, dur: 4.7 },
  { x: 83, y: 67, r: 1.6, o: 0.7, d: 2.5, dur: 4.4 },
  { x: 94, y: 74, r: 0.9, o: 0.4, d: 1.3, dur: 5.8 },
  { x: 11, y: 88, r: 1.1, o: 0.5, d: 3.6, dur: 5.0 },
  { x: 26, y: 92, r: 1.4, o: 0.6, d: 0.3, dur: 4.6 },
  { x: 38, y: 84, r: 0.8, o: 0.35, d: 2.2, dur: 6.3 },
  { x: 52, y: 90, r: 1.3, o: 0.55, d: 1.1, dur: 4.8 },
  { x: 65, y: 86, r: 1, o: 0.45, d: 3.3, dur: 5.4 },
  { x: 77, y: 94, r: 1.5, o: 0.65, d: 0.6, dur: 4.5 },
  { x: 89, y: 89, r: 0.9, o: 0.4, d: 2.0, dur: 6.0 },
  { x: 97, y: 56, r: 1.2, o: 0.55, d: 1.9, dur: 5.3 },
];
