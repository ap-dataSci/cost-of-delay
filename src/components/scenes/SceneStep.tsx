import type { ReactNode } from "react";

type Props = {
  scene: number;
  eyebrow: string;
  active: boolean;
  children: ReactNode;
};

/**
 * Text-only scene step. The chart lives in a sticky container in
 * NarrativeScroll; each step here just provides the scrollama trigger
 * (.narrative-step) and the prose. As a step becomes active, the text fades
 * up; as it scrolls away, it dims back down.
 */
export default function SceneStep({ scene, eyebrow, active, children }: Props) {
  return (
    <section
      className={[
        "narrative-step flex min-h-screen scroll-mt-12 items-center py-14 lg:py-20",
        "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out",
        active
          ? "opacity-100 translate-y-0"
          : "opacity-35 translate-y-2 motion-reduce:translate-y-0 motion-reduce:opacity-50",
      ].join(" ")}
      data-scene={scene}
    >
      <div className="max-w-md">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
          {eyebrow}
        </p>
        <div className="space-y-4 text-2xl font-semibold leading-tight tracking-tight text-neutral-950 md:text-3xl">
          {children}
        </div>
      </div>
    </section>
  );
}
