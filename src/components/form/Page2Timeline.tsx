"use client";

import { copy } from "@/content/copy";
import NumberField from "./NumberField";
import ScrollGate from "./ScrollGate";
import FormSectionShell from "./FormSectionShell";

export type Page2Values = {
  startWorkingAge?: number;
  pastMonthlyCapacity?: number;
  startInvestingAge?: number;
  targetRetirementAge?: number;
};

type Props = {
  values: Page2Values;
  currentAge: number | undefined; // from page 1, used for cross-field validation
  onChange: (next: Page2Values) => void;
};

export function isPage2Valid(v: Page2Values, currentAge: number | undefined): boolean {
  if (
    v.startWorkingAge === undefined ||
    v.pastMonthlyCapacity === undefined ||
    v.startInvestingAge === undefined ||
    v.targetRetirementAge === undefined
  ) {
    return false;
  }
  if (v.startWorkingAge < 14 || v.startWorkingAge > 75) return false;
  if (v.pastMonthlyCapacity < 0) return false;
  if (v.startInvestingAge < v.startWorkingAge) return false;
  if (currentAge !== undefined && v.startInvestingAge > currentAge) return false;
  if (v.targetRetirementAge < 30 || v.targetRetirementAge > 90) return false;
  if (currentAge !== undefined && v.targetRetirementAge < currentAge) return false;
  return true;
}

export default function Page2Timeline({ values, currentAge, onChange }: Props) {
  const t = copy.form.page2;
  const valid = isPage2Valid(values, currentAge);

  return (
    <FormSectionShell
      id="your-timeline"
      pageNumber={2}
      heading={t.heading}
      subheading={t.subheading}
      footer={
        <ScrollGate
          valid={valid}
          validHint={t.scrollHint}
          invalidHint={copy.form.invalidHint}
          nextTargetId="assumptions"
        />
      }
    >
      <NumberField
        {...t.fields.startWorkingAge}
        value={values.startWorkingAge}
        onChange={(v) => onChange({ ...values, startWorkingAge: v })}
        min={14}
        max={75}
      />
      <NumberField
        {...t.fields.pastMonthlyCapacity}
        value={values.pastMonthlyCapacity}
        onChange={(v) => onChange({ ...values, pastMonthlyCapacity: v })}
        min={0}
      />
      <NumberField
        {...t.fields.startInvestingAge}
        value={values.startInvestingAge}
        onChange={(v) => onChange({ ...values, startInvestingAge: v })}
        min={14}
        max={75}
      />
      <NumberField
        {...t.fields.targetRetirementAge}
        value={values.targetRetirementAge}
        onChange={(v) => onChange({ ...values, targetRetirementAge: v })}
        min={30}
        max={90}
      />
    </FormSectionShell>
  );
}
