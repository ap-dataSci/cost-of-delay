"use client";

import { copy } from "@/content/copy";
import NumberField from "./NumberField";
import ScrollGate from "./ScrollGate";

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
    <section
      id="your-timeline"
      data-form-page="2"
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t.heading}
          </h2>
          <p className="text-sm text-neutral-500">{t.subheading}</p>
        </header>

        <div className="flex flex-col gap-4">
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
        </div>

        <ScrollGate
          valid={valid}
          validHint={t.scrollHint}
          invalidHint={copy.form.invalidHint}
          nextTargetId="assumptions"
        />
      </div>
    </section>
  );
}
