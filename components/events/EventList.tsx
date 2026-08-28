import type { JSX } from "react";
import type { ClubEvent } from "@/lib/event-types";
import EventCard from "./EventCard";

export default function EventList({
  events,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
}: {
  events: ClubEvent[];
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (event: ClubEvent) => void;
  onDelete: (event: ClubEvent) => void;
}): JSX.Element {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aktuell sind keine Events geplant.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
