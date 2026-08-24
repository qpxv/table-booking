import type { JSX } from "react";
import { TESTIMONIALS } from "@/lib/website-data";
import TestimonialsGrid from "@/components/website/TestimonialsGrid";

export default function TestimonialsSection(): JSX.Element {
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <span className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
          {TESTIMONIALS.eyebrow}
        </span>
        <h2 className="mt-3 max-w-xl text-balance font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          {TESTIMONIALS.heading}
        </h2>

        <TestimonialsGrid items={TESTIMONIALS.items} />
      </div>
    </section>
  );
}
