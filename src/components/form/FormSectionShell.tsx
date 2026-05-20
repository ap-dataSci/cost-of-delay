"use client";

import type { ReactNode } from "react";

type Props = {
  id: string;
  pageNumber: 1 | 2 | 3;
  heading: string;
  subheading: string;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * Editorial wrapper shared by the three form pages. Section numeral (01/02/03)
 * sits up top with a copper hairline, the heading is in display serif, and
 * the body content stacks beneath. The form contents and gate are passed in
 * by the parent page.
 */
export default function FormSectionShell({
  id,
  pageNumber,
  heading,
  subheading,
  children,
  footer,
}: Props) {
  const numeral = String(pageNumber).padStart(2, "0");

  return (
    <section
      id={id}
      data-form-page={pageNumber}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16"
    >
      <div className="flex w-full max-w-lg flex-col gap-10">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="numeral">{numeral}</span>
            <span
              aria-hidden
              className="h-px w-12 bg-[var(--color-copper)]/60"
            />
            <span className="numeral !text-[var(--color-ink-whisper)]">
              of 03
            </span>
          </div>
          <h2 className="display text-4xl text-[var(--color-ink)] md:text-5xl">
            {heading}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-[var(--color-ink-muted)]">
            {subheading}
          </p>
        </header>

        <div className="flex flex-col gap-7">{children}</div>

        {footer}
      </div>
    </section>
  );
}
