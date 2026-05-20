"use client";

import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";

export type ScrollamaState = {
  currentIndex: number;
  progressByIndex: Record<number, number>;
};

export function useScrollama(
  stepSelector: string,
  opts: { offset?: scrollama.DecimalType; debug?: boolean } = {},
  enabled: boolean = true,
): ScrollamaState {
  const [state, setState] = useState<ScrollamaState>({
    currentIndex: 0,
    progressByIndex: {},
  });
  const scrollerRef = useRef<scrollama.ScrollamaInstance | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const scroller = scrollama();
    scrollerRef.current = scroller;

    scroller
      .setup({
        step: stepSelector,
        offset: opts.offset ?? 0.5,
        debug: opts.debug ?? false,
        progress: true,
      })
      .onStepEnter(({ index }) => {
        setState((prev) => ({ ...prev, currentIndex: index }));
      })
      .onStepProgress(({ index, progress: p }) => {
        setState((prev) => {
          if (prev.progressByIndex[index] === p) return prev;
          return {
            ...prev,
            progressByIndex: { ...prev.progressByIndex, [index]: p },
          };
        });
      });

    const handleResize = () => scroller.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      scroller.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepSelector, enabled]);

  return state;
}
