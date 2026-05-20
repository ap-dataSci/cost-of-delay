"use client";

import { useId } from "react";

type Props = {
  label: string;
  placeholder: string;
  unit: string;
  hint?: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
};

/**
 * Editorial input row. Label sits above as small-caps, the value renders in
 * mono tabular-numbers for a "ledger" feel, unit is a quiet caption to the
 * right, and a thin underline accent in copper signals focus/valid.
 */
export default function NumberField({
  label,
  placeholder,
  unit,
  hint,
  value,
  onChange,
  min,
  max,
  step,
}: Props) {
  const id = useId();
  const isValid =
    value !== undefined &&
    Number.isFinite(value) &&
    (min === undefined || value >= min) &&
    (max === undefined || value <= max);

  return (
    <div className="group flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-ink-muted)] transition-colors group-focus-within:text-[var(--color-ink)]"
      >
        <span>{label}</span>
        <span className="font-normal normal-case tracking-normal text-[var(--color-ink-whisper)]">
          {unit}
        </span>
      </label>

      <div
        className={[
          "relative flex items-center",
          "border-b transition-colors duration-200 ease-out",
          isValid
            ? "border-[var(--color-ink-soft)]"
            : "border-[var(--color-rule-strong)]",
          "focus-within:border-[var(--color-copper)]",
        ].join(" ")}
      >
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(undefined);
              return;
            }
            const n = Number(raw);
            onChange(Number.isFinite(n) ? n : undefined);
          }}
          className="figure flex-1 bg-transparent py-2 text-2xl text-[var(--color-ink)] placeholder:text-[var(--color-ink-whisper)] placeholder:font-light focus:outline-none"
          placeholder={placeholder}
        />
        <ValidCheck visible={isValid} />

        {/* Copper accent underline that animates in when focused. */}
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute -bottom-px left-0 h-[2px] bg-[var(--color-copper)]",
            "transition-[width] duration-300 ease-out",
            "w-0 group-focus-within:w-full",
          ].join(" ")}
        />
      </div>

      {hint ? (
        <span className="text-xs italic text-[var(--color-ink-muted)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function ValidCheck({ visible }: { visible: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={[
        "ml-3 text-[var(--color-emerald-mid)] motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
        visible
          ? "scale-100 opacity-100"
          : "scale-50 opacity-0 motion-reduce:scale-100",
      ].join(" ")}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
