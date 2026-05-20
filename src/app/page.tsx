"use client";

import { useEffect, useMemo, useState } from "react";
import type { StartInputs } from "@/lib/types";
import { copy } from "@/content/copy";
import Disclaimer from "@/components/Disclaimer";
import ProgressRail from "@/components/ProgressRail";
import ScrollBackdrop from "@/components/ScrollBackdrop";
import Page1Now, {
  isPage1Valid,
  type Page1Values,
} from "@/components/form/Page1Now";
import Page2Timeline, {
  isPage2Valid,
  type Page2Values,
} from "@/components/form/Page2Timeline";
import Page3Assumptions, {
  isPage3Valid,
  type Page3Values,
} from "@/components/form/Page3Assumptions";
import NarrativeScroll from "@/components/scenes/NarrativeScroll";

export default function Page() {
  const [page1, setPage1] = useState<Page1Values>({});
  const [page2, setPage2] = useState<Page2Values>({});
  const [page3, setPage3] = useState<Page3Values>({});

  const inputs: StartInputs | null = useMemo(() => {
    if (
      !isPage1Valid(page1) ||
      !isPage2Valid(page2, page1.currentAge) ||
      !isPage3Valid(page3)
    ) {
      return null;
    }
    return {
      currentAge: page1.currentAge!,
      currentInvested: page1.currentInvested!,
      currentMonthlyCapacity: page1.currentMonthlyCapacity!,
      startWorkingAge: page2.startWorkingAge!,
      pastMonthlyCapacity: page2.pastMonthlyCapacity!,
      startInvestingAge: page2.startInvestingAge!,
      targetRetirementAge: page2.targetRetirementAge!,
      annualExpenses: page3.annualExpenses!,
      savingsGrowthRate: (page3.savingsGrowthRatePct ?? 0) / 100,
      investmentReturnRate: (page3.investmentReturnRatePct ?? 0) / 100,
    };
  }, [page1, page2, page3]);

  return (
    <main className="relative">
      <ScrollBackdrop />
      <ProgressRail />
      <IntroSection />
      <Page1Now values={page1} onChange={setPage1} />
      <Page2Timeline
        values={page2}
        currentAge={page1.currentAge}
        onChange={setPage2}
      />
      <Page3Assumptions values={page3} onChange={setPage3} />

      {inputs ? <NarrativeScroll inputs={inputs} /> : <NarrativePlaceholder />}

      <Disclaimer />
    </main>
  );
}

function IntroSection() {
  const t = copy.intro;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const base =
    "motion-safe:transition-all motion-safe:duration-[900ms] motion-safe:ease-out";
  const enter = mounted
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-3 motion-reduce:opacity-100 motion-reduce:translate-y-0";

  return (
    <section
      id="intro"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16"
    >
      <HeroBackdrop mounted={mounted} />

      <div className="relative z-10 flex w-full max-w-2xl flex-col">
        <div className={`mb-6 flex items-center gap-3 ${base} ${enter}`}>
          <span className="h-px w-8 bg-[var(--color-copper)]" aria-hidden />
          <p className="numeral">{t.eyebrow}</p>
        </div>

        <h1
          className={`display mb-8 text-5xl text-[var(--color-ink)] md:text-7xl lg:text-[5.5rem] ${base} motion-safe:delay-100 ${enter}`}
        >
          How much did{" "}
          <em className="font-normal italic underline-brush">waiting</em>
          <br />
          cost you?
        </h1>

        <p
          className={`mb-10 max-w-xl text-base leading-relaxed text-[var(--color-ink-muted)] md:text-lg ${base} motion-safe:delay-200 ${enter}`}
        >
          {t.intro}
        </p>

        <div
          className={`flex items-center gap-3 text-xs text-[var(--color-ink-whisper)] ${base} motion-safe:delay-300 ${enter}`}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-emerald-mid)]"
            aria-hidden
          />
          <span className="numeral !text-[var(--color-ink-whisper)]">
            {t.microDisclaimer}
          </span>
        </div>
      </div>

      <ScrollCue mounted={mounted} />
    </section>
  );
}

/**
 * Decorative backdrop for the hero: a soft emerald orb that drifts, plus a
 * faint hand-drawn "compounding curve" SVG anchored bottom-right. Pure
 * decoration — pointer-events disabled.
 */
function HeroBackdrop({ mounted }: { mounted: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className={[
          "absolute -left-32 -top-32 h-[36rem] w-[36rem] rounded-full",
          "bg-[radial-gradient(closest-side,rgba(52,211,153,0.28),rgba(52,211,153,0)_70%)]",
          "blur-2xl motion-safe:animate-drift",
          "motion-safe:transition-opacity motion-safe:duration-[1400ms] motion-safe:ease-out",
          mounted ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      <div
        className={[
          "absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full",
          "bg-[radial-gradient(closest-side,rgba(245,158,11,0.22),rgba(245,158,11,0)_70%)]",
          "blur-3xl motion-safe:animate-drift-slow",
          "motion-safe:transition-opacity motion-safe:duration-[1800ms] motion-safe:ease-out motion-safe:delay-200",
          mounted ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
        className={[
          "absolute bottom-0 right-0 h-[55vh] w-[80vw] max-w-[1100px]",
          "motion-safe:transition-opacity motion-safe:duration-[1800ms] motion-safe:ease-out motion-safe:delay-500",
          mounted ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <defs>
          <linearGradient id="curveStroke" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor="rgba(52,211,153,0)" />
            <stop offset="60%" stopColor="rgba(52,211,153,0.55)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0.95)" />
          </linearGradient>
        </defs>
        <path
          d="M 0 380 C 200 378, 380 360, 520 300 S 720 120, 800 20"
          fill="none"
          stroke="url(#curveStroke)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M 0 390 C 240 388, 440 380, 580 340 S 740 240, 800 180"
          fill="none"
          stroke="rgba(244,237,225,0.18)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />
      </svg>
    </div>
  );
}

function ScrollCue({ mounted }: { mounted: boolean }) {
  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById("where-you-are-now")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      aria-label="Scroll to start"
      className={[
        "group absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-[var(--color-ink-muted)]",
        "flex flex-col items-center gap-2",
        "motion-safe:transition-opacity motion-safe:duration-1000 motion-safe:delay-500",
        mounted ? "opacity-100" : "opacity-0",
        "hover:text-[var(--color-ink)] focus-visible:text-[var(--color-ink)]",
      ].join(" ")}
    >
      <span className="numeral !text-[var(--color-ink-whisper)] group-hover:!text-[var(--color-ink-muted)] motion-safe:transition-colors">
        Begin
      </span>
      <span className="relative grid h-9 w-9 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-[var(--color-rule-strong)] motion-safe:animate-pulse-soft"
        />
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>
  );
}

function NarrativePlaceholder() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-copper)]"
          aria-hidden
        />
        <p className="text-sm italic text-[var(--color-ink-muted)]">
          Fill in the three sections above. The reveal lives here.
        </p>
      </div>
    </section>
  );
}
