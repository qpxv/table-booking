import type { JSX } from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { checkSession } from "@/lib/session";
import { listUpcomingEventsForUser } from "@/lib/queries/events";
import { formatEventDateRange } from "@/lib/datetime";

export default async function DashboardEvents(): Promise<JSX.Element> {
  const session = await checkSession();

  const result = await listUpcomingEventsForUser(session.user.id);
  if (!result.success) throw new Error(result.message);
  const events = result.events;

  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Du bist aktuell zu keinem Event angemeldet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardContent className="flex flex-col gap-1">
            <CardTitle>{event.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatEventDateRange(event.start, event.end)}
            </p>
            {event.location && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                {event.location}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
