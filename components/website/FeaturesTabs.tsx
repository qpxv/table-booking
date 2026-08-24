"use client";

import { useEffect, useState, type JSX } from "react";
import { CalendarCheck2, Dices, Library, Users, type LucideIcon } from "lucide-react";
import ImagePlaceholder from "@/components/website/ImagePlaceholder";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  Dices,
  CalendarCheck2,
  Library,
  Users,
};

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesTabsProps {
  items: readonly FeatureItem[];
}

export default function FeaturesTabs({ items }: FeaturesTabsProps): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = items[selectedIndex];
  const SelectedIcon = FEATURE_ICONS[selected.icon];

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedIndex((current) => (current + 1) % items.length);
    }, 15000);
    return () => clearTimeout(timer);
  }, [selectedIndex, items.length]);

  return (
    <div className="mt-10 grid border border-border bg-background md:grid-cols-[280px_1fr]">
      <div className="flex flex-col divide-y divide-border border-b border-border md:border-r md:border-b-0">
        {items.map((item, index) => {
          const Icon = FEATURE_ICONS[item.icon];
          const isSelected = index === selectedIndex;
          return (
            <button
              key={item.title}
              type="button"
              aria-current={isSelected}
              onClick={() => setSelectedIndex(index)}
              className={
                isSelected
                  ? "flex flex-1 items-center gap-3 border-l-4 border-l-secondary bg-secondary/10 px-6 py-5 text-left font-medium text-foreground"
                  : "flex flex-1 items-center gap-3 border-l-4 border-l-transparent px-6 py-5 text-left text-muted-foreground transition-colors hover:bg-muted/40"
              }
            >
              <Icon className="size-5 shrink-0" />
              {item.title}
            </button>
          );
        })}
      </div>

      <div key={selectedIndex} className="animate-in fade-in flex flex-col gap-6 p-8 duration-300 md:p-10">
        <span className="flex size-12 items-center justify-center bg-primary text-primary-foreground">
          <SelectedIcon className="size-6" />
        </span>
        <div>
          <h3 className="font-heading text-2xl font-semibold text-foreground">{selected.title}</h3>
          <p className="mt-2 min-h-12 text-pretty text-muted-foreground">{selected.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ImagePlaceholder label="Foto folgt" className="aspect-video" />
          <ImagePlaceholder label="Foto folgt" className="aspect-video" />
        </div>
      </div>
    </div>
  );
}
