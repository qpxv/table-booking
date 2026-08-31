"use client";

import { useMemo, useRef, useState, type JSX } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import deLocale from "@fullcalendar/core/locales/de";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEARCH_PARAMS } from "@/lib/constants";
import type { CalendarBooking } from "@/lib/booking-types";

function formatDuration(start: Date, end: Date): string {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} Min`;
  if (mins === 0) return `${hours} Std`;
  return `${hours} Std ${mins} Min`;
}

function renderEventContent(arg: EventContentArg): JSX.Element {
  const { attendees, game } = arg.event.extendedProps as { attendees: string; game: string | null };
  const duration =
    arg.event.start && arg.event.end ? formatDuration(arg.event.start, arg.event.end) : "";

  return (
    <div className="flex flex-col gap-0.5 overflow-hidden px-1 py-0.5 leading-tight">
      <div className="truncate font-semibold">{attendees}</div>
      <div className="truncate text-[0.7rem] opacity-90">
        {arg.timeText}
        {duration && ` (${duration})`}
      </div>
      {game && <div className="truncate text-[0.7rem] italic opacity-90">{game}</div>}
    </div>
  );
}

export default function BookingWeekGrid({
  bookings,
  currentUserId,
  isAdmin,
  tableAllowsMultiple,
  initialDate,
  onSelect,
  onEventClick,
  onReschedule,
}: {
  bookings: CalendarBooking[];
  currentUserId: string;
  isAdmin: boolean;
  tableAllowsMultiple: boolean;
  initialDate?: string;
  onSelect: (start: string, end: string) => void;
  onEventClick: (bookingId: string) => void;
  onReschedule: (bookingId: string, start: Date, end: Date, revert: () => void) => void;
}): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);
  const [title, setTitle] = useState("");

  const events: EventInput[] = useMemo(
    () =>
      bookings.map((booking) => {
        const isOwn = booking.userId === currentUserId;
        const isParticipant = booking.participants.some((p) => p.userId === currentUserId);
        const attendees = [
          ...booking.participants.map((p) => p.name),
          ...booking.guests.map((g) => g.name),
        ].join(", ");
        return {
          id: booking.id,
          start: booking.start,
          end: booking.end,
          title: booking.game ? `${attendees} (${booking.game})` : attendees,
          backgroundColor: isParticipant ? "var(--secondary)" : "#57534e",
          borderColor: isParticipant ? "var(--secondary)" : "#57534e",
          textColor: isParticipant ? "var(--secondary-foreground)" : "#ffffff",
          editable: isOwn || isAdmin,
          extendedProps: { isOwn, attendees, game: booking.game },
        };
      }),
    [bookings, currentUserId, isAdmin],
  );

  function handleDatesSet(arg: DatesSetArg): void {
    setTitle(arg.view.title);

    const params = new URLSearchParams(searchParams.toString());
    params.set(SEARCH_PARAMS.DATE, arg.startStr.slice(0, 10));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSelect(selectInfo: DateSelectArg): void {
    selectInfo.view.calendar.unselect();
    onSelect(selectInfo.startStr, selectInfo.endStr);
  }

  function handleEventClick(clickInfo: EventClickArg): void {
    onEventClick(clickInfo.event.id);
  }

  function handleEventDrop(dropInfo: EventDropArg): void {
    const { event } = dropInfo;
    if (!event.start || !event.end) {
      dropInfo.revert();
      return;
    }
    onReschedule(event.id, event.start, event.end, dropInfo.revert);
  }

  function handleEventResize(resizeInfo: EventResizeDoneArg): void {
    const { event } = resizeInfo;
    if (!event.start || !event.end) {
      resizeInfo.revert();
      return;
    }
    onReschedule(event.id, event.start, event.end, resizeInfo.revert);
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
        <Button variant="outline" size="sm" onClick={() => calendarRef.current?.getApi().today()}>
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
        plugins={[timeGridPlugin, interactionPlugin, luxonPlugin]}
        initialDate={initialDate}
        initialView="timeGridWeek"
        timeZone="Europe/Berlin"
        locale={deLocale}
        headerToolbar={false}
        datesSet={handleDatesSet}
        slotMinTime="08:00:00"
        slotMaxTime="24:00:00"
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        allDaySlot={false}
        selectable
        selectOverlap={tableAllowsMultiple}
        selectMirror
        selectLongPressDelay={300}
        eventStartEditable
        select={handleSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventContent={renderEventContent}
        events={events}
        height="auto"
      />
    </div>
  );
}
