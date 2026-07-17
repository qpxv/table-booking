"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import deLocale from "@fullcalendar/core/locales/de";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuestWithVisits } from "@/actions/guests";
import { updateBooking } from "@/actions/bookings";
import BookingDialog from "./BookingDialog";

export type CalendarBooking = {
  id: string;
  start: Date;
  end: Date;
  game: string | null;
  userId: string;
  userName: string;
  guestNames: string[];
};

type DialogState =
  | { mode: "create"; start: string; end: string }
  | { mode: "edit"; booking: CalendarBooking };

function describeOtherBooking(booking: CalendarBooking): string {
  const parts = [booking.userName];
  if (booking.guestNames.length > 0) parts.push(`+ ${booking.guestNames.join(", ")}`);
  const withGame = booking.game ? `${parts.join(" ")} – ${booking.game}` : parts.join(" ");
  return withGame;
}

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [title, setTitle] = useState("");

  const initialDate = searchParams.get("date") ?? undefined;

  const events: EventInput[] = useMemo(
    () =>
      bookings.map((booking) => {
        const isOwn = booking.userId === currentUserId;
        return {
          id: booking.id,
          start: booking.start,
          end: booking.end,
          title: isOwn ? booking.game || "Deine Buchung" : describeOtherBooking(booking),
          backgroundColor: isOwn ? "var(--header)" : "#475569",
          borderColor: isOwn ? "var(--header)" : "#475569",
          textColor: isOwn ? "var(--header-foreground)" : "#ffffff",
          editable: isOwn,
          extendedProps: { isOwn },
        };
      }),
    [bookings, currentUserId],
  );

  function handleDatesSet(arg: DatesSetArg) {
    setTitle(arg.view.title);

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", arg.startStr.slice(0, 10));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

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

  async function persistReschedule(
    bookingId: string,
    start: Date,
    end: Date,
    revert: () => void,
  ) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      revert();
      return;
    }

    const result = await updateBooking(bookingId, {
      start,
      end,
      game: booking.game ?? undefined,
    });

    if (result.error) {
      alert(result.error);
      revert();
    }
  }

  function handleEventDrop(dropInfo: EventDropArg) {
    const { event } = dropInfo;
    if (!event.start || !event.end) {
      dropInfo.revert();
      return;
    }
    void persistReschedule(event.id, event.start, event.end, dropInfo.revert);
  }

  function handleEventResize(resizeInfo: EventResizeDoneArg) {
    const { event } = resizeInfo;
    if (!event.start || !event.end) {
      resizeInfo.revert();
      return;
    }
    void persistReschedule(event.id, event.start, event.end, resizeInfo.revert);
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
        plugins={[timeGridPlugin, interactionPlugin, momentTimezonePlugin]}
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
        selectOverlap={false}
        select={handleSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
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
