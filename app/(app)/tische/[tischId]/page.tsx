import { Suspense, type JSX } from "react";
import TableCalendarContent from "@/components/bookings/TableCalendarContent";
import TableCalendarSkeleton from "@/components/bookings/TableCalendarSkeleton";

export default async function TableCalendarPage({
  params,
}: {
  params: Promise<{ tischId: string }>;
}): Promise<JSX.Element> {
  const { tischId } = await params;

  return (
    <Suspense key={tischId} fallback={<TableCalendarSkeleton />}>
      <TableCalendarContent tischId={tischId} />
    </Suspense>
  );
}
