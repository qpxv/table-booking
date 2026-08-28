import { Suspense, type JSX } from "react";
import DashboardBookings from "@/components/bookings/DashboardBookings";
import DashboardBookingsSkeleton from "@/components/bookings/DashboardBookingsSkeleton";
import DashboardEvents from "@/components/events/DashboardEvents";
import DashboardEventsSkeleton from "@/components/events/DashboardEventsSkeleton";
import DashboardPlayerSearchInterests from "@/components/player-search/DashboardPlayerSearchInterests";

export default function DashboardPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={null}>
        <DashboardPlayerSearchInterests />
      </Suspense>

      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Anstehende Reservierungen</h1>
        <Suspense fallback={<DashboardBookingsSkeleton />}>
          <DashboardBookings />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Anstehende Events</h2>
        <Suspense fallback={<DashboardEventsSkeleton />}>
          <DashboardEvents />
        </Suspense>
      </section>
    </div>
  );
}
