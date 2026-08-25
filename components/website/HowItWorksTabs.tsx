"use client";

import { Fragment, useState, type JSX } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  Eye,
  MessageCircle,
  Swords,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImagePlaceholder from "@/components/website/ImagePlaceholder";

const STEP_ICONS: Record<string, LucideIcon> = {
  UserPlus,
  CalendarCheck2,
  Swords,
  MessageCircle,
  CalendarClock,
  Eye,
};

interface StepHighlight {
  word: string;
  title: string;
  description: string;
}

interface StepItem {
  number: string;
  icon: string;
  title: string;
  description: string;
  highlight?: StepHighlight;
}

function StepDescription({ description, highlight }: { description: string; highlight?: StepHighlight }): JSX.Element {
  if (!highlight) {
    return <>{description}</>;
  }

  const [before, after] = description.split(highlight.word);

  return (
    <>
      {before}
      <DialogPrimitive.Root>
        <DialogPrimitive.Trigger className="cursor-pointer text-muted-foreground underline underline-offset-3 hover:text-foreground">
          {highlight.word}
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="dark fixed inset-0 z-50 bg-background/80 backdrop-blur-sm duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Popup className="dark fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-6 text-sm text-foreground duration-150 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <DialogPrimitive.Title className="font-heading text-lg font-semibold text-foreground">
              {highlight.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-muted-foreground">
              {highlight.description}
            </DialogPrimitive.Description>
            <DialogPrimitive.Close className="absolute top-4 right-4 flex size-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Schließen</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      {after}
    </>
  );
}

interface TabItem {
  id: string;
  label: string;
  steps: readonly StepItem[];
}

interface HowItWorksTabsProps {
  tabs: readonly TabItem[];
}

export default function HowItWorksTabs({ tabs }: HowItWorksTabsProps): JSX.Element {
  const [selectedId, setSelectedId] = useState(tabs[0].id);
  const selected = tabs.find((tab) => tab.id === selectedId) ?? tabs[0];

  return (
    <div className="relative mt-10 border border-border bg-background">
      <div className="flex divide-x divide-border border-b border-border">
        {tabs.map((tab) => {
          const isSelected = tab.id === selectedId;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isSelected}
              onClick={() => setSelectedId(tab.id)}
              className={cn(
                "flex-1 px-6 py-4 text-center text-sm font-medium transition-colors",
                isSelected
                  ? "bg-secondary/20 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div key={selected.id} className="animate-in fade-in p-6 duration-300 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-0">
          {selected.steps.map((step, index) => {
            const Icon = STEP_ICONS[step.icon];
            return (
              <Fragment key={step.number}>
                <div className="relative flex flex-col gap-3 overflow-hidden border border-border bg-card p-8">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2 right-4 font-heading text-8xl font-semibold text-foreground/5"
                  >
                    {step.number}
                  </span>
                  <span className="relative flex size-12 items-center justify-center text-secondary">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="relative min-h-7 font-heading text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="relative min-h-16 text-sm text-muted-foreground">
                    <StepDescription description={step.description} highlight={step.highlight} />
                  </p>
                </div>

                {index < selected.steps.length - 1 && (
                  <div aria-hidden="true" className="hidden items-center justify-center px-2 md:flex">
                    <ArrowRight className="size-6 text-secondary" />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>

        <ImagePlaceholder label="Impressionen vom Spieleabend" className="mt-6 aspect-21/9" />
      </div>
    </div>
  );
}
