import type { JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Same responsive grid (1 / 2 / 3 columns) and card anatomy as TablesGrid:
// icon square + title row, then a large count, a caption line and a date line.
export default function TablesGridSkeleton(): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
