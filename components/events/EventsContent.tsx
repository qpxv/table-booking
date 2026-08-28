import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { listUpcomingEvents } from "@/lib/queries/events";
import EventsView from "./EventsView";

export default async function EventsContent(): Promise<JSX.Element> {
  const session = await checkSession();

  const result = await listUpcomingEvents();
  if (!result.success) throw new Error(result.message);

  return (
    <EventsView
      events={result.events}
      currentUserId={session.user.id}
      isAdmin={isAdmin(session)}
    />
  );
}
