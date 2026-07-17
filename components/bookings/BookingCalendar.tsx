"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import deLocale from "@fullcalendar/core/locales/de";
import type { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { COLORS } from "@/lib/theme";
import type { GuestWithVisits } from "@/actions/guests";
import BookingDialog from "./BookingDialog";

export type CalendarBooking = {
  id: string;
  start: Date;
  end: Date;
  game: string | null;
  userId: string;
};

type DialogState =
  | { mode: "create"; start: string; end: string }
  | { mode: "edit"; booking: CalendarBooking };

export default function BookingCalendar({
  tableId,
  tableName,
  currentUserId,
  bookings,
  knownGuests,
}: {
  tableId: string;
  tableName: string;
  currentUserId: string;
  bookings: CalendarBooking[];
  knownGuests: GuestWithVisits[];
}) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const events: EventInput[] = useMemo(
    () =>
      bookings.map((booking) => {
        const isOwn = booking.userId === currentUserId;
        return {
          id: booking.id,
          start: booking.start,
          end: booking.end,
          title: isOwn ? booking.game || "Deine Buchung" : "Belegt",
          backgroundColor: isOwn ? COLORS.secondary : "#9e9e9e",
          borderColor: isOwn ? COLORS.secondary : "#9e9e9e",
          editable: false,
          extendedProps: { isOwn },
        };
      }),
    [bookings, currentUserId],
  );

  function handleSelect(selectInfo: DateSelectArg) {
    selectInfo.view.calendar.unselect();
    setDialog({
      mode: "create",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const isOwn = Boolean(clickInfo.event.extendedProps.isOwn);
    if (!isOwn) return;

    const booking = bookings.find((b) => b.id === clickInfo.event.id);
    if (!booking) return;
    setDialog({ mode: "edit", booking });
  }

  return (
    <div>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin, momentTimezonePlugin]}
        initialView="timeGridWeek"
        timeZone="Europe/Berlin"
        locale={deLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        slotMinTime="08:00:00"
        slotMaxTime="24:00:00"
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        allDaySlot={false}
        selectable
        selectOverlap={false}
        select={handleSelect}
        eventClick={handleEventClick}
        events={events}
        height="auto"
      />
      {dialog && (
        <BookingDialog
          mode={dialog.mode}
          tableId={tableId}
          tableName={tableName}
          bookingId={dialog.mode === "edit" ? dialog.booking.id : undefined}
          initialStart={
            dialog.mode === "create" ? dialog.start : dialog.booking.start.toISOString()
          }
          initialEnd={dialog.mode === "create" ? dialog.end : dialog.booking.end.toISOString()}
          knownGuests={knownGuests}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
