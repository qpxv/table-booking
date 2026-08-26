"use client";

import { useMemo, useOptimistic, useRef, useState, type JSX } from "react";
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
  EventContentArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuestWithVisits } from "@/lib/guest-types";
import type { Game } from "@/generated/prisma/client";
import { updateBooking } from "@/service/booking-service/booking";
import { showToast } from "@/lib/toast";
import { DIALOG_MODE, SEARCH_PARAMS } from "@/lib/constants";
import type { CalendarBooking, GuestSelection, OptimisticBookingAction } from "@/lib/booking-types";
import type { MemberOption } from "@/lib/user-types";
import BookingDialog from "./BookingDialog";
import BookingJoinDialog from "./BookingJoinDialog";

type DialogState =
  | { mode: typeof DIALOG_MODE.CREATE; start: string; end: string }
  | { mode: typeof DIALOG_MODE.EDIT; booking: CalendarBooking }
  | { mode: typeof DIALOG_MODE.JOIN; booking: CalendarBooking };

function formatDuration(start: Date, end: Date): string {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} Min`;
  if (mins === 0) return `${hours} Std`;
  return `${hours} Std ${mins} Min`;
}

function applyOptimisticBookingAction(
  state: CalendarBooking[],
  action: OptimisticBookingAction,
): CalendarBooking[] {
  if (action.type === "remove") return state.filter((b) => b.id !== action.id);
  const exists = state.some((b) => b.id === action.booking.id);
  return exists
    ? state.map((b) => (b.id === action.booking.id ? action.booking : b))
    : [...state, action.booking];
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

export default function BookingCalendar({
  tableId,
  tableName,
  currentUserId,
  isAdmin,
  tableAllowsMultiple,
  bookings,
  knownGuests,
  knownGames,
  knownMembers,
}: {
  tableId: string;
  tableName: string;
  currentUserId: string;
  isAdmin: boolean;
  tableAllowsMultiple: boolean;
  bookings: CalendarBooking[];
  knownGuests: GuestWithVisits[];
  knownGames: Pick<Game, "id" | "name">[];
  knownMembers: MemberOption[];
}): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [title, setTitle] = useState("");
  const [optimisticBookings, dispatchOptimisticBooking] = useOptimistic(
    bookings,
    applyOptimisticBookingAction,
  );

  const initialDate = searchParams.get(SEARCH_PARAMS.DATE) ?? undefined;

  const events: EventInput[] = useMemo(
    () =>
      optimisticBookings.map((booking) => {
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
    [optimisticBookings, currentUserId, isAdmin],
  );

  const editingGuests: GuestSelection[] =
    dialog?.mode === DIALOG_MODE.EDIT
      ? dialog.booking.guests
          .map((g) => knownGuests.find((kg) => kg.id === g.guestId))
          .filter((g): g is GuestWithVisits => Boolean(g))
          .map((guest) => ({ type: "existing", guest }))
      : [];

  const initialGuestPrices: Record<string, number> =
    dialog?.mode === DIALOG_MODE.EDIT
      ? Object.fromEntries(dialog.booking.guests.map((g) => [g.guestId, g.price]))
      : {};

  const editingParticipants: MemberOption[] =
    dialog?.mode === DIALOG_MODE.EDIT
      ? dialog.booking.participants
          .filter((p) => p.userId !== dialog.booking.userId)
          .map((p) => ({ id: p.userId, name: p.name }))
      : [];

  const creatorUserId = dialog?.mode === DIALOG_MODE.EDIT ? dialog.booking.userId : currentUserId;

  function handleDatesSet(arg: DatesSetArg): void {
    setTitle(arg.view.title);

    const params = new URLSearchParams(searchParams.toString());
    params.set(SEARCH_PARAMS.DATE, arg.startStr.slice(0, 10));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSelect(selectInfo: DateSelectArg): void {
    selectInfo.view.calendar.unselect();
    setDialog({
      mode: DIALOG_MODE.CREATE,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
  }

  function handleEventClick(clickInfo: EventClickArg): void {
    const booking = optimisticBookings.find((b) => b.id === clickInfo.event.id);
    if (!booking) return;
    setDialog({ mode: DIALOG_MODE.JOIN, booking });
  }

  async function persistReschedule(
    bookingId: string,
    start: Date,
    end: Date,
    revert: () => void,
  ): Promise<void> {
    const booking = optimisticBookings.find((b) => b.id === bookingId);
    if (!booking) {
      revert();
      return;
    }

    const result = await updateBooking(bookingId, {
      start,
      end,
      game: booking.game ?? undefined,
    });

    showToast(result);
    if (!result.success) revert();
  }

  function handleEventDrop(dropInfo: EventDropArg): void {
    const { event } = dropInfo;
    if (!event.start || !event.end) {
      dropInfo.revert();
      return;
    }
    void persistReschedule(event.id, event.start, event.end, dropInfo.revert);
  }

  function handleEventResize(resizeInfo: EventResizeDoneArg): void {
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
      {dialog && dialog.mode === DIALOG_MODE.JOIN && (
        <BookingJoinDialog
          tableName={tableName}
          booking={dialog.booking}
          currentUserId={currentUserId}
          canEdit={dialog.booking.userId === currentUserId || isAdmin}
          onEdit={() => setDialog({ mode: DIALOG_MODE.EDIT, booking: dialog.booking })}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog && dialog.mode !== DIALOG_MODE.JOIN && (
        <BookingDialog
          mode={dialog.mode}
          tableId={tableId}
          tableName={tableName}
          bookingId={dialog.mode === DIALOG_MODE.EDIT ? dialog.booking.id : undefined}
          initialStart={
            dialog.mode === DIALOG_MODE.CREATE ? dialog.start : dialog.booking.start.toISOString()
          }
          initialEnd={
            dialog.mode === DIALOG_MODE.CREATE ? dialog.end : dialog.booking.end.toISOString()
          }
          initialGame={dialog.mode === DIALOG_MODE.EDIT ? (dialog.booking.game ?? "") : ""}
          initialGuests={editingGuests}
          initialGuestPrices={initialGuestPrices}
          initialParticipants={editingParticipants}
          dispatchOptimisticBooking={dispatchOptimisticBooking}
          knownGuests={knownGuests}
          knownGames={knownGames}
          knownMembers={knownMembers}
          creatorUserId={creatorUserId}
          tableAllowsMultiple={tableAllowsMultiple}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
