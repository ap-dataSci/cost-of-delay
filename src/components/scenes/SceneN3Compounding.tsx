import { copy } from "@/content/copy";
import type { NarrativeModel } from "@/lib/narrative";
import SceneStep from "./SceneStep";

type Props = {
  active: boolean;
  model: NarrativeModel;
};

export default function SceneN3Compounding({ active, model }: Props) {
  const yearsElapsed = Math.max(
    model.inputs.currentAge - model.inputs.startWorkingAge,
    0,
  );
  return (
    <SceneStep scene={3} eyebrow="N3 / Compounding" active={active}>
      <p>{copy.narrative.n3.text(yearsElapsed)}</p>
      <p className="text-base font-normal leading-relaxed text-[var(--color-ink-muted)] md:text-lg">
        {copy.narrative.n3.annotation}
      </p>
    </SceneStep>
  );
}
