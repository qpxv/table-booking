import type { JSX } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the structure of components/ui/data-table.tsx (bordered rounded
// container, an h-10 header row, then p-2 body rows) so swapping in the real
// table causes no layout shift. Column/row counts are passed by each call
// site to match the table it stands in for.
export default function DataTableSkeleton({
  columns = 4,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border">
        <div className="flex h-10 items-center gap-4 border-b px-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full max-w-24 shrink" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-b px-2 py-3 last:border-0"
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-4 w-full max-w-32 shrink" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
