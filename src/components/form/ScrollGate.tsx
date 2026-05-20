"use client";

type Props = {
  valid: boolean;
  validHint: string;
  invalidHint: string;
  nextTargetId: string;
};

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
      className="flex flex-col items-center gap-2 pb-12 pt-16 transition-opacity duration-500"
      aria-live="polite"
    >
      <p
        className={
          valid
            ? "text-sm text-neutral-500"
            : "text-sm text-neutral-300"
        }
      >
        {valid ? validHint : invalidHint}
      </p>
      <button
        type="button"
        onClick={scrollToNext}
        disabled={!valid}
        aria-label={valid ? validHint : invalidHint}
        className={[
          "grid h-10 w-10 place-items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2",
          valid
            ? "cursor-pointer text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            : "cursor-not-allowed text-neutral-300",
        ].join(" ")}
      >
        <Chevron animated={valid} />
      </button>
    </div>
  );
}

function Chevron({ animated }: { animated: boolean }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        animated ? "animate-[bounce_2s_ease-in-out_infinite]" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
