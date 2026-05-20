import { copy } from "@/content/copy";
import type { NarrativeModel } from "@/lib/narrative";
import SceneStep from "./SceneStep";

type Props = {
  active: boolean;
  model: NarrativeModel;
};

export default function SceneN1Rewind({ active, model }: Props) {
  return (
    <SceneStep scene={1} eyebrow="N1 / Rewind" active={active}>
      <p>{copy.narrative.n1.text(model.inputs.startWorkingAge)}</p>
    </SceneStep>
  );
}
