"use client";

import dynamic from "next/dynamic";
import { useOptimistic, useState, type JSX } from "react";
import { useSearchParams } from "next/navigation";
import type { GuestWithVisits } from "@/lib/guest-types";
import type { Game } from "@/generated/prisma/client";
import { updateBooking } from "@/service/booking-service/booking";
import { showToast } from "@/lib/toast";
import { DIALOG_MODE, SEARCH_PARAMS } from "@/lib/constants";
import { useIsMobileResolved } from "@/hooks/use-mobile";
import type { CalendarBooking, GuestSelection, OptimisticBookingAction } from "@/lib/booking-types";
import type { MemberOption } from "@/lib/user-types";
import BookingDialog from "./BookingDialog";
import BookingJoinDialog from "./BookingJoinDialog";
import BookingUpcomingList from "./BookingUpcomingList";
import { CalendarResponsiveSkeleton, CalendarWeekGridSkeleton } from "./TableCalendarSkeleton";

// FullCalendar + its plugins are ~200 KB of JS that only the desktop week
// grid needs. Loading it here (not in the parent) keeps it out of the bundle
// on phones, which render the lightweight list instead.
const BookingWeekGrid = dynamic(() => import("./BookingWeekGrid"), {
  ssr: false,
  loading: () => <CalendarWeekGridSkeleton />,
});

type DialogState =
  | { mode: typeof DIALOG_MODE.CREATE; start: string; end: string }
  | { mode: typeof DIALOG_MODE.EDIT; booking: CalendarBooking }
  | { mode: typeof DIALOG_MODE.JOIN; booking: CalendarBooking };

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
  const searchParams = useSearchParams();
  const isMobile = useIsMobileResolved();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [optimisticBookings, dispatchOptimisticBooking] = useOptimistic(
    bookings,
    applyOptimisticBookingAction,
  );

  const initialDate = searchParams.get(SEARCH_PARAMS.DATE) ?? undefined;

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

  function openCreate(start: string, end: string): void {
    setDialog({ mode: DIALOG_MODE.CREATE, start, end });
  }

  function openBooking(bookingId: string): void {
    const booking = optimisticBookings.find((b) => b.id === bookingId);
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

  function handleReschedule(
    bookingId: string,
    start: Date,
    end: Date,
    revert: () => void,
  ): void {
    void persistReschedule(bookingId, start, end, revert);
  }

  return (
    <div>
      {isMobile === undefined ? (
        <CalendarResponsiveSkeleton />
      ) : isMobile ? (
        <BookingUpcomingList
          bookings={optimisticBookings}
          currentUserId={currentUserId}
          onOpenBooking={openBooking}
          onCreate={openCreate}
        />
      ) : (
        <BookingWeekGrid
          bookings={optimisticBookings}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          tableAllowsMultiple={tableAllowsMultiple}
          initialDate={initialDate}
          onSelect={openCreate}
          onEventClick={openBooking}
          onReschedule={handleReschedule}
        />
      )}

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
