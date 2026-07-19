"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuestWithVisits } from "@/actions/guests";
import type { Game } from "@/generated/prisma/client";
import { updateBooking } from "@/actions/bookings";
import BookingDialog from "./BookingDialog";
import BookingJoinDialog from "./BookingJoinDialog";
import type { GuestSelection } from "./GuestMultiCombobox";

export type CalendarBooking = {
  id: string;
  start: Date;
  end: Date;
  game: string | null;
  userId: string;
  userName: string;
  guests: { guestId: string; name: string }[];
  participants: { userId: string; name: string }[];
};

type DialogState =
  | { mode: "create"; start: string; end: string }
  | { mode: "edit"; booking: CalendarBooking }
  | { mode: "join"; booking: CalendarBooking };

function formatDuration(start: Date, end: Date): string {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} Min`;
  if (mins === 0) return `${hours} Std`;
  return `${hours} Std ${mins} Min`;
}

function renderEventContent(arg: EventContentArg) {
  const { attendees, game } = arg.event.extendedProps as { attendees: string; game: string | null };
  const duration =
    arg.event.start && arg.event.end ? formatDuration(arg.event.start, arg.event.end) : "";

  return (
    <div className="flex flex-col gap-0.5 overflow-hidden px-1 py-0.5 leading-tight">
      <div className="truncate font-semibold">{attendees}</div>
      <div className="truncate text-[0.7rem] opacity-90">
        {arg.timeText}
        {duration && ` · ${duration}`}
      </div>
      {game && <div className="truncate text-[0.7rem] italic opacity-90">{game}</div>}
    </div>
  );
}

export default function BookingCalendar({
  tableId,
  tableName,
  currentUserId,
  isAdmin,
  tableAllowsMultiple,
  bookings,
  knownGuests,
  knownGames,
}: {
  tableId: string;
  tableName: string;
  currentUserId: string;
  isAdmin: boolean;
  tableAllowsMultiple: boolean;
  bookings: CalendarBooking[];
  knownGuests: GuestWithVisits[];
  knownGames: Pick<Game, "id" | "name">[];
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
        const isParticipant = tableAllowsMultiple
          ? booking.participants.some((p) => p.userId === currentUserId)
          : isOwn;
        const attendees = tableAllowsMultiple
          ? booking.participants.map((p) => p.name).join(", ")
          : [booking.userName, ...booking.guests.map((g) => g.name)].join(", ");
        return {
          id: booking.id,
          start: booking.start,
          end: booking.end,
          title: booking.game ? `${attendees} – ${booking.game}` : attendees,
          backgroundColor: isParticipant ? "var(--secondary)" : "#57534e",
          borderColor: isParticipant ? "var(--secondary)" : "#57534e",
          textColor: isParticipant ? "var(--secondary-foreground)" : "#ffffff",
          editable: isOwn || isAdmin,
          extendedProps: { isOwn, attendees, game: booking.game },
        };
      }),
    [bookings, currentUserId, isAdmin, tableAllowsMultiple],
  );

  const editingGuests: GuestSelection[] =
    dialog?.mode === "edit"
      ? dialog.booking.guests
          .map((g) => knownGuests.find((kg) => kg.id === g.guestId))
          .filter((g): g is GuestWithVisits => Boolean(g))
          .map((guest) => ({ type: "existing", guest }))
      : [];

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
    const booking = bookings.find((b) => b.id === clickInfo.event.id);
    if (!booking) return;

    if (tableAllowsMultiple) {
      setDialog({ mode: "join", booking });
      return;
    }

    const isOwn = Boolean(clickInfo.event.extendedProps.isOwn);
    if (!isOwn && !isAdmin) return;
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

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
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
      {dialog && dialog.mode === "join" && (
        <BookingJoinDialog
          tableName={tableName}
          booking={dialog.booking}
          currentUserId={currentUserId}
          canEdit={dialog.booking.userId === currentUserId || isAdmin}
          onEdit={() => setDialog({ mode: "edit", booking: dialog.booking })}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog && dialog.mode !== "join" && (
        <BookingDialog
          mode={dialog.mode}
          tableId={tableId}
          tableName={tableName}
          bookingId={dialog.mode === "edit" ? dialog.booking.id : undefined}
          initialStart={
            dialog.mode === "create" ? dialog.start : dialog.booking.start.toISOString()
          }
          initialEnd={dialog.mode === "create" ? dialog.end : dialog.booking.end.toISOString()}
          initialGame={dialog.mode === "edit" ? (dialog.booking.game ?? "") : ""}
          initialGuests={editingGuests}
          knownGuests={knownGuests}
          knownGames={knownGames}
          tableAllowsMultiple={tableAllowsMultiple}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
