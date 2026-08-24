import type { JSX } from "react";
import { HOW_IT_WORKS } from "@/lib/website-data";

export default function HowItWorksSection(): JSX.Element {
  return (
    <section id="ablauf" className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <span className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
          {HOW_IT_WORKS.eyebrow}
        </span>
        <h2 className="mt-3 max-w-xl text-balance font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          {HOW_IT_WORKS.heading}
        </h2>

        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.steps.map((step) => (
            <li key={step.number} className="flex flex-col gap-3 border border-border bg-background p-6">
              <span className="flex size-10 items-center justify-center bg-primary font-heading text-sm font-semibold text-primary-foreground">
                {step.number}
              </span>
              <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
