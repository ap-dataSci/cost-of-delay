"use client";

import { useEffect, useState } from "react";

/**
 * Hairline progress bar pinned to the top of the page that tracks total scroll
 * completion. Copper fill on a near-transparent rule, with the rule itself
 * only showing once the user has scrolled past the hero.
 */
export default function ProgressRail() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const doc = document.documentElement;
      const scrolled = window.scrollY;
      const total = doc.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const visible = progress > 0.005;

  return (
    <div
      aria-hidden
      className={[
        "fixed inset-x-0 top-0 z-50 h-px",
        "motion-safe:transition-opacity motion-safe:duration-500",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="relative h-full w-full bg-[var(--color-rule)]">
        <div
          className="absolute inset-y-0 left-0 bg-[var(--color-copper)]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
