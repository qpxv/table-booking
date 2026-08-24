"use client";

import { useState, type JSX } from "react";
import { ChevronDown, ChevronUp, Quote, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
}

interface TestimonialsGridProps {
  items: readonly TestimonialItem[];
}

const ALWAYS_VISIBLE_COUNT = 6;

export default function TestimonialsGrid({ items }: TestimonialsGridProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > ALWAYS_VISIBLE_COUNT;
  const isCollapsed = hasMore && !expanded;

  return (
    <div className="mt-10">
      <div
        className={cn("relative overflow-hidden", isCollapsed && "max-h-[44rem]")}
        style={isCollapsed ? { maskImage: "linear-gradient(to bottom, black 75%, transparent 100%)" } : undefined}
      >
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="relative mb-6 flex flex-col gap-6 overflow-hidden border border-border bg-background p-8 break-inside-avoid"
            >
              <Quote
                aria-hidden="true"
                className="pointer-events-none absolute top-4 right-4 size-16 text-foreground/5"
              />
              <p className="relative text-pretty text-sm text-muted-foreground">{item.quote}</p>
              <div className="relative flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted/60 text-muted-foreground">
                  <User className="size-5" />
                </span>
                <div className="flex flex-col">
                  <span className="font-heading text-sm font-semibold text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {expanded ? "Weniger lesen" : "Mehr lesen"}
          </button>
        </div>
      )}
    </div>
  );
}
