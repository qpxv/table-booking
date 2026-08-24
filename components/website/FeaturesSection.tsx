import type { JSX } from "react";
import { CalendarCheck2, Dices, Library, Users, type LucideIcon } from "lucide-react";
import { FEATURES } from "@/lib/website-data";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  Dices,
  CalendarCheck2,
  Library,
  Users,
};

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

        <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.items.map((feature) => {
            const Icon = FEATURE_ICONS[feature.icon];
            return (
              <div key={feature.title} className="flex flex-col gap-3 border-l-4 border-l-secondary bg-background p-6">
                <Icon className="size-7 text-secondary" />
                <h3 className="font-heading text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
