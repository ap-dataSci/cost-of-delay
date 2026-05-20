"use client";

import { copy } from "@/content/copy";
import NumberField from "./NumberField";
import ScrollGate from "./ScrollGate";

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
    <section
      id="where-you-are-now"
      data-form-page="1"
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
        </div>

        <ScrollGate
          valid={valid}
          validHint={t.scrollHint}
          invalidHint={copy.form.invalidHint}
          nextTargetId="your-timeline"
        />
      </div>
    </section>
  );
}
