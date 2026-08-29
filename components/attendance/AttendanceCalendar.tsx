"use client";

import { useMemo, useRef, useState, type JSX } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import deLocale from "@fullcalendar/core/locales/de";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttendanceDay } from "@/lib/queries/attendance";

// Month overview of who is anwesend. Clicking a day cell (or its pill)
// toggles the current member's attendance for that day: no dialog, just the
// toggle. Past days are outside `validRange`, so they render disabled and
// don't fire clicks.
export default function AttendanceCalendar({
  days,
  todayString,
  onToggle,
}: {
  days: AttendanceDay[];
  todayString: string;
  onToggle: (day: string) => void;
}): JSX.Element {
  const calendarRef = useRef<FullCalendar>(null);
  const [title, setTitle] = useState("");

  const events: EventInput[] = useMemo(
    () =>
      days
        .filter((day) => day.count > 0)
        .map((day) => ({
          id: day.date,
          start: day.date,
          allDay: true,
          title: `${day.count} anwesend`,
          backgroundColor: day.mePresent ? "var(--secondary)" : "#57534e",
          borderColor: day.mePresent ? "var(--secondary)" : "#57534e",
          textColor: day.mePresent ? "var(--secondary-foreground)" : "#ffffff",
        })),
    [days],
  );

  function toggle(day: string): void {
    if (day < todayString) return;
    onToggle(day);
  }

  function handleDateClick(arg: DateClickArg): void {
    toggle(arg.dateStr);
  }

  function handleEventClick(arg: EventClickArg): void {
    toggle(arg.event.id);
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
        plugins={[dayGridPlugin, interactionPlugin, luxonPlugin]}
        initialView="dayGridMonth"
        timeZone="Europe/Berlin"
        locale={deLocale}
        headerToolbar={false}
        validRange={{ start: todayString }}
        datesSet={(arg) => setTitle(arg.view.title)}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        events={events}
        height="auto"
      />
    </div>
  );
}
