import type { JSX } from "react";
import { FEATURES } from "@/lib/website-data";
import FeaturesTabs from "@/components/website/FeaturesTabs";

export default function FeaturesSection(): JSX.Element {
  return (
    <section id="angebot" className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <span className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
          {FEATURES.eyebrow}
        </span>
        <h2 className="mt-3 max-w-xl text-balance font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          {FEATURES.heading}
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          {FEATURES.description}
        </p>

        <FeaturesTabs items={FEATURES.items} />
      </div>
    </section>
  );
}
