"use client";

import { useMemo } from "react";
import Timeline from "@/components/Timeline";
import { buildNarrativeModel } from "@/lib/narrative";
import { useScrollama } from "@/lib/scrollytelling";
import type { StartInputs } from "@/lib/types";
import SceneN1Rewind from "./SceneN1Rewind";
import SceneN2RoadNotTaken from "./SceneN2RoadNotTaken";
import SceneN3Compounding from "./SceneN3Compounding";
import SceneN4RevealToday from "./SceneN4RevealToday";
import SceneN5RevealRetirement from "./SceneN5RevealRetirement";

type Props = {
  inputs: StartInputs;
};

/**
 * Scrollytelling layout. The chart lives in a sticky container on the right
 * (desktop) or pinned to the top of the viewport (mobile); the five text
 * steps stack underneath/beside it and scroll past. Scrollama tracks the
 * active step, and the active step's progress drives within-scene animation
 * inside the chart.
 */
export default function NarrativeScroll({ inputs }: Props) {
  const model = useMemo(() => buildNarrativeModel(inputs), [inputs]);
  // offset: 1 keeps progress=1 firing as the step's top reaches viewport top
  // (i.e. the step is centered in view for ~100vh scenes).
  const { currentIndex, progressByIndex } = useScrollama(".narrative-step", {
    offset: 1,
  });
  const scene = Math.min(Math.max(currentIndex + 1, 1), 5) as 1 | 2 | 3 | 4 | 5;
  const activeProgress = progressByIndex[currentIndex] ?? 0;

  return (
    <section
      id="narrative"
      aria-label="Cost of delay narrative"
      className="relative border-t border-[var(--color-rule)]"
    >
      {/* Sectional header that announces we've left the form behind. */}
      <div className="mx-auto max-w-6xl px-6 pt-16 lg:pt-24">
        <div className="flex items-center gap-3">
          <span className="numeral">II</span>
          <span aria-hidden className="h-px w-12 bg-[var(--color-copper)]/60" />
          <span className="numeral !text-[var(--color-ink-whisper)]">
            The reveal
          </span>
        </div>
        <h2 className="display mt-4 text-3xl text-[var(--color-ink)] md:text-4xl">
          Two trajectories.
        </h2>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)] lg:gap-12">
          {/* Sticky chart column. Mobile: pinned to top, ~45vh tall. Desktop:
              full-height column, centered vertically. */}
          <div className="order-1 lg:order-2">
            <div className="sticky top-0 z-10 flex h-[52vh] items-center border-b border-[var(--color-rule)] bg-[var(--color-paper)]/80 py-3 backdrop-blur lg:h-screen lg:border-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-0">
              <div className="w-full">
                <Timeline
                  model={model}
                  scene={scene}
                  progress={activeProgress}
                />
              </div>
            </div>
          </div>
          {/* Text column with stacked scene steps. */}
          <div className="order-2 lg:order-1">
            <SceneN1Rewind active={scene === 1} model={model} />
            <SceneN2RoadNotTaken active={scene === 2} model={model} />
            <SceneN3Compounding active={scene === 3} model={model} />
            <SceneN4RevealToday active={scene === 4} model={model} />
            <SceneN5RevealRetirement active={scene === 5} model={model} />
          </div>
        </div>
      </div>
    </section>
  );
}
