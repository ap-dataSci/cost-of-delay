"use client";

import { copy } from "@/content/copy";
import NumberField from "./NumberField";
import ScrollGate from "./ScrollGate";
import FormSectionShell from "./FormSectionShell";

export type Page1Values = {
  currentAge?: number;
  currentInvested?: number;
  currentMonthlyCapacity?: number;
};

type Props = {
  values: Page1Values;
  onChange: (next: Page1Values) => void;
};

export function isPage1Valid(v: Page1Values): boolean {
  return (
    v.currentAge !== undefined &&
    v.currentAge >= 18 &&
    v.currentAge <= 75 &&
    v.currentInvested !== undefined &&
    v.currentInvested >= 0 &&
    v.currentMonthlyCapacity !== undefined &&
    v.currentMonthlyCapacity >= 0
  );
}

export default function Page1Now({ values, onChange }: Props) {
  const t = copy.form.page1;
  const valid = isPage1Valid(values);

  return (
    <FormSectionShell
      id="where-you-are-now"
      pageNumber={1}
      heading={t.heading}
      subheading={t.subheading}
      footer={
        <ScrollGate
          valid={valid}
          validHint={t.scrollHint}
          invalidHint={copy.form.invalidHint}
          nextTargetId="your-timeline"
        />
      }
    >
      <NumberField
        {...t.fields.currentAge}
        value={values.currentAge}
        onChange={(v) => onChange({ ...values, currentAge: v })}
        min={18}
        max={75}
      />
      <NumberField
        {...t.fields.currentInvested}
        value={values.currentInvested}
        onChange={(v) => onChange({ ...values, currentInvested: v })}
        min={0}
      />
      <NumberField
        {...t.fields.currentMonthlyCapacity}
        value={values.currentMonthlyCapacity}
        onChange={(v) => onChange({ ...values, currentMonthlyCapacity: v })}
        min={0}
      />
    </FormSectionShell>
  );
}
