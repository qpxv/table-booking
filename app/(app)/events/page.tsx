import { Suspense, type JSX } from "react";
import EventsContent from "@/components/events/EventsContent";
import EventsListSkeleton from "@/components/events/EventsListSkeleton";

export default function EventsPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Events</h1>
        <p className="text-sm text-muted-foreground">
          Anstehende Vereinsaktionen. Melde dich an, wenn du dabei bist.
        </p>
      </div>

      <Suspense fallback={<EventsListSkeleton />}>
        <EventsContent />
      </Suspense>
    </div>
  );
}
