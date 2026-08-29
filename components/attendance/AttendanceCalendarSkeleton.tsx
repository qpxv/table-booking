import type { JSX } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CELLS = 42; // 6 weeks

// Month-grid stand-in mirroring AttendanceCalendar's toolbar + dayGrid
// layout, shown while the server data or the lazy FullCalendar chunk loads.
export default function AttendanceCalendarSkeleton(): JSX.Element {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="ml-2 h-4 w-40" />
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-lg border">
        {Array.from({ length: CELLS }).map((_, i) => (
          <div key={i} className="aspect-square border-r border-b p-1.5 last:border-r-0">
            <Skeleton className="h-3 w-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
