import type { JSX } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const HOUR_ROWS = 12;
const DAYS = 7;

// Faint placeholder events, positioned with static arbitrary values so the
// grid reads as a real week view rather than an empty box.
const GHOST_EVENTS: { day: number; className: string }[] = [
  { day: 1, className: "top-[3rem] h-[4.5rem]" },
  { day: 2, className: "top-[7.5rem] h-[3rem]" },
  { day: 3, className: "top-[2rem] h-[6rem]" },
  { day: 4, className: "top-[9rem] h-[3.75rem]" },
  { day: 5, className: "top-[4.5rem] h-[5.25rem]" },
];

// The prev / today / next / title toolbar plus a FullCalendar-style week grid
// (day-header row, left time axis, seven day columns with hour gridlines).
// Shared by the page-level Suspense fallback and the lazy-load fallback for
// the FullCalendar chunk, so both look identical.
export function CalendarWeekGridSkeleton(): JSX.Element {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="ml-2 h-4 w-40" />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="flex border-b">
          <div className="w-12 shrink-0 border-r sm:w-14" />
          {Array.from({ length: DAYS }).map((_, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1 border-r py-2 last:border-r-0"
            >
              <Skeleton className="h-2.5 w-7" />
              <Skeleton className="h-4 w-5" />
            </div>
          ))}
        </div>

        <div className="flex">
          <div className="w-12 shrink-0 border-r sm:w-14">
            {Array.from({ length: HOUR_ROWS }).map((_, i) => (
              <div key={i} className="flex h-12 items-start justify-end pr-1.5 pt-1">
                <Skeleton className="h-2.5 w-6" />
              </div>
            ))}
          </div>

          {Array.from({ length: DAYS }).map((_, day) => (
            <div key={day} className="relative flex-1 border-r last:border-r-0">
              {Array.from({ length: HOUR_ROWS }).map((_, i) => (
                <div key={i} className="h-12 border-b last:border-b-0" />
              ))}
              {GHOST_EVENTS.filter((event) => event.day === day).map((event, i) => (
                <Skeleton
                  key={i}
                  className={cn("absolute inset-x-0.5 rounded-md", event.className)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mirrors TableCalendarContent: the data-dependent table-name heading, then
// the toolbar + week grid.
export default function TableCalendarSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-48" />
      <CalendarWeekGridSkeleton />
    </div>
  );
}
