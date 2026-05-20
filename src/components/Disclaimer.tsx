import { copy } from "@/content/copy";

export default function Disclaimer() {
  return (
    <footer className="mx-auto mt-16 max-w-3xl px-6 py-14">
      <div className="rule-fine mb-8" />
      <div className="flex flex-col gap-4">
        <p className="numeral">Fine print</p>
        <ul className="space-y-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
          {copy.footer.disclaimerBullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span
                aria-hidden
                className="mt-[0.6em] inline-block h-px w-3 shrink-0 bg-[var(--color-copper)]"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs italic text-[var(--color-ink-whisper)]">
          {copy.footer.credit}
        </p>
      </div>
    </footer>
  );
}
