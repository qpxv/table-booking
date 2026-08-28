import { Suspense, type JSX } from "react";
import DashboardBookings from "@/components/bookings/DashboardBookings";
import DashboardBookingsSkeleton from "@/components/bookings/DashboardBookingsSkeleton";

export default function DashboardPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Deine anstehenden Reservierungen</h1>
      <Suspense fallback={<DashboardBookingsSkeleton />}>
        <DashboardBookings />
      </Suspense>
    </div>
  );
}
