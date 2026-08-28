import type { JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Matches the stacked event cards in DashboardEvents: a title line plus one
// or two muted detail lines per card.
export default function DashboardEventsSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-52" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
