import type { ReactNode } from "react";

type Props = {
  scene: number;
  eyebrow: string;
  active: boolean;
  children: ReactNode;
};

/**
 * Editorial scene step. The chart lives in a sticky container in
 * NarrativeScroll; each step here provides the scrollama trigger
 * (.narrative-step) and the prose. The eyebrow renders as a copper numeral
 * with a hairline; the body is set in display serif at large size, with
 * mono treatment for any inline figures inside.
 */
export default function SceneStep({ scene, eyebrow, active, children }: Props) {
  return (
    <section
      className={[
        "narrative-step flex min-h-screen scroll-mt-12 items-center py-14 lg:py-20",
        "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
        active
          ? "opacity-100 translate-y-0"
          : "opacity-30 translate-y-2 blur-[1px] motion-reduce:translate-y-0 motion-reduce:opacity-50 motion-reduce:blur-0",
      ].join(" ")}
      data-scene={scene}
    >
      <div className="max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <span
            aria-hidden
            className={[
              "h-px w-8 motion-safe:transition-all motion-safe:duration-700",
              active
                ? "bg-[var(--color-copper)] w-12"
                : "bg-[var(--color-rule-strong)] w-8",
            ].join(" ")}
          />
          <p className="numeral">{eyebrow}</p>
        </div>
        <div className="display space-y-4 text-3xl leading-[1.1] text-[var(--color-ink)] md:text-[2.5rem]">
          {children}
        </div>
      </div>
    </section>
  );
}
