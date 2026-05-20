"use client";

import { useEffect, useMemo, useState } from "react";
import type { StartInputs } from "@/lib/types";
import { copy } from "@/content/copy";
import Disclaimer from "@/components/Disclaimer";
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
    <main className="bg-white text-neutral-900">
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

  // Common transition for staggered fade-up. Each block adds its own delay.
  const base =
    "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out";
  const enter = mounted
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-2 motion-reduce:opacity-100 motion-reduce:translate-y-0";

  return (
    <section
      id="intro"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16"
    >
      <div className="flex w-full max-w-md flex-col">
        <p
          className={`mb-3 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500 ${base} ${enter}`}
        >
          {t.eyebrow}
        </p>
        <h1
          className={`mb-5 text-4xl font-bold tracking-tight md:text-6xl ${base} motion-safe:delay-100 ${enter}`}
        >
          {t.title}
        </h1>
        <p
          className={`mb-8 text-base leading-relaxed text-neutral-600 md:text-lg ${base} motion-safe:delay-200 ${enter}`}
        >
          {t.intro}
        </p>
        <p
          className={`text-xs text-neutral-400 ${base} motion-safe:delay-300 ${enter}`}
        >
          {t.microDisclaimer}
        </p>
      </div>
      <ScrollCue mounted={mounted} />
    </section>
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
        "absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-400",
        "motion-safe:transition-opacity motion-safe:duration-1000 motion-safe:delay-500",
        mounted ? "opacity-100" : "opacity-0",
        "hover:text-neutral-900 focus:outline-none focus:text-neutral-900",
      ].join(" ")}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="motion-safe:animate-[bounce_2.4s_ease-in-out_infinite]"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function NarrativePlaceholder() {
  return (
    <section className="flex min-h-screen items-center justify-center px-6 py-16">
      <p className="max-w-md text-center text-sm text-neutral-400">
        Fill in the three sections above. The narrative reveal will appear here.
      </p>
    </section>
  );
}
