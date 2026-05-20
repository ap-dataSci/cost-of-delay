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

export default function SceneN5RevealRetirement({ active, model }: Props) {
  const {
    actualRetirementAge,
    counterfactualRetirementAge,
    fireTarget,
    yearsGap,
  } = model;

  if (
    actualRetirementAge === null ||
    counterfactualRetirementAge === null ||
    yearsGap === null
  ) {
    return (
      <SceneStep scene={5} eyebrow="N5 / Retirement" active={active}>
        <p>
          At these assumptions, one or both paths do not reach the FIRE number
          inside the projection window.
        </p>
      </SceneStep>
    );
  }

  const headline =
    yearsGap > 0
      ? copy.narrative.n5.text(
          fmtCAD.format(fireTarget),
          actualRetirementAge,
          counterfactualRetirementAge,
          yearsGap,
        )
      : `You'll hit ${fmtCAD.format(fireTarget)} at ${actualRetirementAge}. No head start to compare against on these inputs.`;

  return (
    <SceneStep scene={5} eyebrow="N5 / Retirement" active={active}>
      <p>{headline}</p>
      {yearsGap > 0 ? (
        <p className="text-base font-normal leading-relaxed text-neutral-500 md:text-lg">
          The delay shows up as time, not just dollars.
        </p>
      ) : null}
    </SceneStep>
  );
}
