"use client";

import { useTransition, type JSX } from "react";
import { MapPin, LogIn, LogOut, Pencil, Trash2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatBerlin } from "@/lib/datetime";
import { joinEvent, leaveEvent } from "@/service/event-service/event";
import { showToast } from "@/lib/toast";
import type { ClubEvent } from "@/lib/event-types";

export default function EventCard({
  event,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
}: {
  event: ClubEvent;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (event: ClubEvent) => void;
  onDelete: (event: ClubEvent) => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const isParticipant = event.participants.some((p) => p.userId === currentUserId);

  function toggleAttendance(): void {
    startTransition(async () => {
      const result = isParticipant ? await leaveEvent(event.id) : await joinEvent(event.id);
      showToast(result);
    });
  }

  const timeLabel = event.end
    ? `${formatBerlin(event.start)} – ${formatBerlin(event.end, "HH:mm")} Uhr`
    : `${formatBerlin(event.start)} Uhr`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-base font-medium leading-snug">{event.title}</p>
            <p className="text-sm text-muted-foreground">{timeLabel}</p>
          </div>
          {isAdmin && (
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Event bearbeiten"
                onClick={() => onEdit(event)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Event löschen"
                onClick={() => onDelete(event)}
              >
                <Trash2 />
              </Button>
            </div>
          )}
        </div>

        {event.location && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {event.location}
          </p>
        )}
        {event.description && (
          <p className="text-sm whitespace-pre-line">{event.description}</p>
        )}

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <Users className="size-4" />
            {event.participants.length === 0
              ? "Noch niemand angemeldet"
              : event.participants.length === 1
                ? "1 Teilnehmer"
                : `${event.participants.length} Teilnehmer`}
          </p>
          {event.participants.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {event.participants.map((participant) => (
                <li
                  key={participant.userId}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-sm",
                    participant.userId === currentUserId
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted",
                  )}
                >
                  {participant.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            variant={isParticipant ? "outline" : "default"}
            size="sm"
            onClick={toggleAttendance}
            disabled={pending}
          >
            {pending ? <Spinner /> : isParticipant ? <LogOut /> : <LogIn />}
            {isParticipant ? "Doch nicht" : "Ich bin dabei"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
