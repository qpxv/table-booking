"use client";

import { useMemo, useRef, useState, type JSX } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import deLocale from "@fullcalendar/core/locales/de";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClubEvent } from "@/lib/event-types";

// Admin-only month overview. Editing happens in dialogs, not on the grid:
// clicking an event opens the edit dialog; clicking an empty day cell opens
// the create dialog pre-filled with that date (times are still set there).
export default function EventCalendar({
  events,
  onSelectEvent,
  onCreateOnDate,
}: {
  events: ClubEvent[];
  onSelectEvent: (event: ClubEvent) => void;
  onCreateOnDate: (date: Date) => void;
}): JSX.Element {
  const calendarRef = useRef<FullCalendar>(null);
  const [title, setTitle] = useState("");

  const calendarEvents: EventInput[] = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end ?? undefined,
        allDay: event.end === null,
      })),
    [events],
  );

  function handleEventClick(clickInfo: EventClickArg): void {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) onSelectEvent(event);
  }

  function handleDateClick(arg: DateClickArg): void {
    // arg.dateStr is the plain YYYY-MM-DD of the clicked cell; parsing it as
    // a local date keeps it aligned with how DateTimeField reads Date parts.
    onCreateOnDate(new Date(`${arg.dateStr}T00:00:00`));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Zurück"
          onClick={() => calendarRef.current?.getApi().prev()}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => calendarRef.current?.getApi().today()}
        >
          Heute
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Weiter"
          onClick={() => calendarRef.current?.getApi().next()}
        >
          <ChevronRight />
        </Button>
        <span className="ml-2 text-sm font-medium capitalize">{title}</span>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin, momentTimezonePlugin]}
        initialView="dayGridMonth"
        timeZone="Europe/Berlin"
        locale={deLocale}
        headerToolbar={false}
        datesSet={(arg) => setTitle(arg.view.title)}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        events={calendarEvents}
        height="auto"
      />
    </div>
  );
}
