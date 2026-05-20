import { copy } from "@/content/copy";
import type { NarrativeModel } from "@/lib/narrative";
import SceneStep from "./SceneStep";

type Props = {
  active: boolean;
  model: NarrativeModel;
};

export default function SceneN3Compounding({ active, model: _model }: Props) {
  return (
    <SceneStep scene={3} eyebrow="N3 / Compounding" active={active}>
      <p>{copy.narrative.n3.text}</p>
      <p className="text-base font-normal leading-relaxed text-neutral-500 md:text-lg">
        {copy.narrative.n3.annotation}
      </p>
    </SceneStep>
  );
}
