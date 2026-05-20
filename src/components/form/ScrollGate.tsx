"use client";

type Props = {
  valid: boolean;
  validHint: string;
  invalidHint: string;
  nextTargetId: string;
};

/**
 * The scroll-gate sits at the bottom of each form page. When the page is
 * invalid, the chevron is dim and disabled with an apologetic note. When
 * valid, it morphs into a pill button with copper accent, animated chevron,
 * and a hint inviting the next move.
 */
export default function ScrollGate({
  valid,
  validHint,
  invalidHint,
  nextTargetId,
}: Props) {
  function scrollToNext() {
    if (!valid) return;
    document.getElementById(nextTargetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div
      className="flex flex-col items-center gap-4 pb-12 pt-16"
      aria-live="polite"
    >
      <p
        className={[
          "numeral motion-safe:transition-colors motion-safe:duration-500",
          valid
            ? "!text-[var(--color-copper)]"
            : "!text-[var(--color-ink-whisper)]",
        ].join(" ")}
      >
        {valid ? validHint : invalidHint}
      </p>
      <button
        type="button"
        onClick={scrollToNext}
        disabled={!valid}
        aria-label={valid ? validHint : invalidHint}
        className={[
          "group relative grid place-items-center rounded-full",
          "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out",
          valid
            ? "h-11 w-11 cursor-pointer border border-[var(--color-copper)] text-[var(--color-copper)] hover:bg-[var(--color-copper)] hover:text-[var(--color-paper)]"
            : "h-10 w-10 cursor-not-allowed border border-[var(--color-rule-strong)] text-[var(--color-ink-whisper)]",
        ].join(" ")}
      >
        {valid ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border border-[var(--color-copper)] opacity-50 motion-safe:animate-pulse-soft"
          />
        ) : null}
        <Chevron animated={valid} />
      </button>
    </div>
  );
}

function Chevron({ animated }: { animated: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        "motion-safe:transition-transform motion-safe:duration-300",
        animated ? "motion-safe:group-hover:translate-y-0.5" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
