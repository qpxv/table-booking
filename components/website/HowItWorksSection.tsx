import type { JSX } from "react";
import { HOW_IT_WORKS } from "@/lib/website-data";
import HowItWorksTabs from "@/components/website/HowItWorksTabs";

export default function HowItWorksSection(): JSX.Element {
  return (
    <section id="ablauf" className="relative overflow-hidden border-b border-border bg-muted/40">
      <div
        className="pointer-events-none absolute inset-0 text-[color-mix(in_oklch,var(--border),var(--secondary)_30%)] opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <span className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
          {HOW_IT_WORKS.eyebrow}
        </span>
        <h2 className="mt-3 max-w-xl text-balance font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          {HOW_IT_WORKS.heading}
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          {HOW_IT_WORKS.description}
        </p>

        <HowItWorksTabs tabs={HOW_IT_WORKS.tabs} />
      </div>
    </section>
  );
}
