import type { JSX } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import DataTableSkeleton from "./DataTableSkeleton";

// Shape shared by the admin manager views and the guest history view: a
// right-aligned action button above a data table.
export default function ManagerTableSkeleton({
  columns = 5,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-40" />
      </div>
      <DataTableSkeleton columns={columns} rows={rows} />
    </div>
  );
}
