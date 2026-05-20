import { copy } from "@/content/copy";

export default function Disclaimer() {
  return (
    <footer className="mx-auto max-w-2xl border-t border-neutral-200 px-6 py-10 text-xs text-neutral-500">
      <ul className="space-y-1.5">
        {copy.footer.disclaimerBullets.map((bullet) => (
          <li key={bullet} className="leading-relaxed">
            {bullet}
          </li>
        ))}
      </ul>
      <p className="mt-4 italic">{copy.footer.credit}</p>
    </footer>
  );
}
