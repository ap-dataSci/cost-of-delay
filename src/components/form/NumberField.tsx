"use client";

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
  const isValid =
    value !== undefined &&
    Number.isFinite(value) &&
    (min === undefined || value >= min) &&
    (max === undefined || value <= max);

  return (
    <label className="group flex flex-col gap-1">
      <span className="text-sm text-neutral-500 transition-colors group-focus-within:text-neutral-900">
        {label}
      </span>
      <div
        className={[
          "flex items-center gap-3 rounded-md border bg-white px-4 py-2",
          "transition-all duration-200 ease-out",
          isValid
            ? "border-neutral-900/20"
            : "border-neutral-300",
          "focus-within:border-neutral-900 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]",
        ].join(" ")}
      >
        <input
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
          className="flex-1 bg-transparent text-lg tabular-nums focus:outline-none"
          placeholder={placeholder}
        />
        <ValidCheck visible={isValid} />
        <span className="text-xs text-neutral-400">{unit}</span>
      </div>
      {hint ? <span className="text-xs text-neutral-400">{hint}</span> : null}
    </label>
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
        "text-emerald-600 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
        visible
          ? "scale-100 opacity-100"
          : "scale-50 opacity-0 motion-reduce:scale-100",
      ].join(" ")}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
