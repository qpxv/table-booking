import { Fragment, type JSX } from "react";
import { ArrowRight, CalendarCheck2, Swords, UserPlus, type LucideIcon } from "lucide-react";
import { HOW_IT_WORKS } from "@/lib/website-data";
import ImagePlaceholder from "@/components/website/ImagePlaceholder";

const STEP_ICONS: Record<string, LucideIcon> = {
  UserPlus,
  CalendarCheck2,
  Swords,
};

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

        <div className="mt-10 grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-0">
          {HOW_IT_WORKS.steps.map((step, index) => {
            const Icon = STEP_ICONS[step.icon];
            return (
              <Fragment key={step.number}>
                <div className="relative flex flex-col gap-3 overflow-hidden border border-border bg-background p-8">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2 right-4 font-heading text-8xl font-semibold text-foreground/5"
                  >
                    {step.number}
                  </span>
                  <span className="relative flex size-12 items-center justify-center text-secondary">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="relative font-heading text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="relative text-sm text-muted-foreground">{step.description}</p>
                </div>

                {index < HOW_IT_WORKS.steps.length - 1 && (
                  <div aria-hidden="true" className="hidden items-center justify-center px-2 md:flex">
                    <ArrowRight className="size-6 text-secondary" />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>

        <ImagePlaceholder label="Impressionen vom Spieleabend" className="mt-10 aspect-21/9" />
      </div>
    </section>
  );
}
