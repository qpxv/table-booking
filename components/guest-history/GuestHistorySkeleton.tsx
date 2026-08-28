import type { JSX } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import DataTableSkeleton from "@/components/shared/DataTableSkeleton";

// Description line plus the guest history table (member, guest, visit,
// price, status, action).
export default function GuestHistorySkeleton(): JSX.Element {
  return (
    <>
      <Skeleton className="h-4 w-72" />
      <DataTableSkeleton columns={6} rows={8} />
    </>
  );
}
