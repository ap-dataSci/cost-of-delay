import { copy } from "@/content/copy";
import type { NarrativeModel } from "@/lib/narrative";
import SceneStep from "./SceneStep";

type Props = {
  active: boolean;
  model: NarrativeModel;
};

const fmtCAD = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export default function SceneN4RevealToday({ active, model }: Props) {
  return (
    <SceneStep scene={4} eyebrow="N4 / Today" active={active}>
      <p>
        {copy.narrative.n4.text(
          model.inputs.currentAge,
          fmtCAD.format(model.counterfactualToday),
          fmtCAD.format(model.inputs.currentInvested),
          fmtCAD.format(model.headStart),
        )}
      </p>
    </SceneStep>
  );
}
