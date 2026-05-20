"use client";

import { copy } from "@/content/copy";
import NumberField from "./NumberField";
import ScrollGate from "./ScrollGate";

export type Page3Values = {
  annualExpenses?: number;
  // Percent-as-percent in UI (e.g. 3 means 3%). Converted to decimal when assembling StartInputs.
  savingsGrowthRatePct?: number;
  investmentReturnRatePct?: number;
};

type Props = {
  values: Page3Values;
  onChange: (next: Page3Values) => void;
};

export function isPage3Valid(v: Page3Values): boolean {
  return (
    v.annualExpenses !== undefined &&
    v.annualExpenses >= 0 &&
    v.savingsGrowthRatePct !== undefined &&
    v.savingsGrowthRatePct >= 0 &&
    v.savingsGrowthRatePct <= 20 &&
    v.investmentReturnRatePct !== undefined &&
    v.investmentReturnRatePct >= 0 &&
    v.investmentReturnRatePct <= 15
  );
}

export default function Page3Assumptions({ values, onChange }: Props) {
  const t = copy.form.page3;
  const valid = isPage3Valid(values);

  return (
    <section
      id="assumptions"
      data-form-page="3"
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
            {...t.fields.annualExpenses}
            value={values.annualExpenses}
            onChange={(v) => onChange({ ...values, annualExpenses: v })}
            min={0}
          />
          <NumberField
            {...t.fields.savingsGrowthRate}
            value={values.savingsGrowthRatePct}
            onChange={(v) => onChange({ ...values, savingsGrowthRatePct: v })}
            min={0}
            max={20}
            step={0.1}
          />
          <NumberField
            {...t.fields.investmentReturnRate}
            value={values.investmentReturnRatePct}
            onChange={(v) => onChange({ ...values, investmentReturnRatePct: v })}
            min={0}
            max={15}
            step={0.1}
          />
        </div>

        <ScrollGate
          valid={valid}
          validHint={t.scrollHint}
          invalidHint={copy.form.invalidHint}
          nextTargetId="narrative"
        />
      </div>
    </section>
  );
}
