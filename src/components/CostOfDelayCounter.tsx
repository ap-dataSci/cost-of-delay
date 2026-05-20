"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  targetValue: number;
  visible: boolean;
};

const fmt = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export default function CostOfDelayCounter({ targetValue, visible }: Props) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      setDisplayValue(0);
      fromRef.current = 0;
      return;
    }

    const from = fromRef.current;
    const to = targetValue;
    const duration = 1500; // ms

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    function animate(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplayValue(current);
      fromRef.current = current;

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, visible]);

  return (
    <div
      className={`mb-4 text-center transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-neutral-500">
        Cost of Delay
      </p>
      <p className="text-4xl font-bold tabular-nums text-neutral-900 md:text-6xl">
        {fmt.format(Math.round(displayValue))}
      </p>
    </div>
  );
}
