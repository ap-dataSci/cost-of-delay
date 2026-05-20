import { copy } from "@/content/copy";
import type { NarrativeModel } from "@/lib/narrative";
import SceneStep from "./SceneStep";

type Props = {
  active: boolean;
  model: NarrativeModel;
};

export default function SceneN2RoadNotTaken({ active, model }: Props) {
  return (
    <SceneStep scene={2} eyebrow="N2 / The road not taken" active={active}>
      <p>
        {copy.narrative.n2.text(
          model.inputs.pastMonthlyCapacity,
          model.inputs.investmentReturnRate,
        )}
      </p>
    </SceneStep>
  );
}
