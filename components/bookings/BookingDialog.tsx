"use client";

import { useCallback, useMemo, useState, useTransition, type JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarX, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import DateTimeField from "./DateTimeField";
import GameCombobox from "./GameCombobox";
import GuestMultiCombobox from "./GuestMultiCombobox";
import MemberMultiCombobox from "./MemberMultiCombobox";
import {
  isExistingGuestSelection,
  type CalendarBooking,
  type GuestSelection,
  type OptimisticBookingAction,
} from "@/lib/booking-types";
import type { MemberOption } from "@/lib/user-types";
import type { GuestWithVisits } from "@/lib/guest-types";
import type { Game } from "@/generated/prisma/client";
import { calculateGuestPrice, GUEST_PRICE_FIRST_VISIT } from "@/lib/pricing";
import {
  bookingFieldsSchema,
  type BookingFieldsInput,
  type GuestInput,
} from "@/lib/schemas/booking";
import { createBooking, updateBooking, cancelBooking } from "@/service/booking-service/booking";
import { showToast } from "@/lib/toast";
import { DIALOG_MODE, CONFIRM_MODE, MESSAGES } from "@/lib/constants";

// Only rendered by the parent while the dialog should be open. The initial
// values are taken directly from props on mount (no reset effect needed).
export default function BookingDialog({
  mode,
  tableId,
  tableName,
  bookingId,
  initialStart,
  initialEnd,
  initialGame,
  initialGuests,
  initialGuestPrices,
  initialParticipants,
  dispatchOptimisticBooking,
  knownGuests,
  knownGames,
  knownMembers,
  creatorUserId,
  tableAllowsMultiple,
  onClose,
}: {
  mode: typeof DIALOG_MODE.CREATE | typeof DIALOG_MODE.EDIT;
  tableId: string;
  tableName: string;
  bookingId?: string;
  initialStart: string;
  initialEnd: string;
  initialGame?: string;
  initialGuests?: GuestSelection[];
  initialGuestPrices?: Record<string, number>;
  initialParticipants?: MemberOption[];
  dispatchOptimisticBooking: (action: OptimisticBookingAction) => void;
  knownGuests: GuestWithVisits[];
  knownGames: Pick<Game, "id" | "name">[];
  knownMembers: MemberOption[];
  creatorUserId: string;
  tableAllowsMultiple: boolean;
  onClose: () => void;
}): JSX.Element {
  const [selectedGuests, setSelectedGuests] = useState<GuestSelection[]>(initialGuests ?? []);
  const [selectedParticipants, setSelectedParticipants] = useState<MemberOption[]>(
    initialParticipants ?? [],
  );
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectableMembers = useMemo(
    () => knownMembers.filter((member) => member.id !== creatorUserId),
    [knownMembers, creatorUserId],
  );

  const form = useForm<BookingFieldsInput>({
    resolver: zodResolver(bookingFieldsSchema),
    defaultValues: {
      start: new Date(initialStart),
      end: new Date(initialEnd),
      game: initialGame ?? "",
    },
  });

  // A guest already on this booking has a real, already-frozen price
  // (initialGuestPrices, keyed by guestId) — showing that instead of a live
  // recompute matters once the guest's overall visit count has moved on
  // since this booking was created/last saved (e.g. an earlier visit of
  // theirs got cancelled). A guest not yet on this booking has no frozen
  // price yet, so fall back to the live estimate.
  const resolveGuestPrice = useCallback(
    (selection: GuestSelection): number => {
      if (!isExistingGuestSelection(selection)) return GUEST_PRICE_FIRST_VISIT;
      const frozenPrice = initialGuestPrices?.[selection.guest.id];
      return frozenPrice !== undefined ? frozenPrice : calculateGuestPrice(selection.guest.visitCount);
    },
    [initialGuestPrices],
  );

  const guestCost = useMemo(
    () => selectedGuests.reduce((total, selection) => total + resolveGuestPrice(selection), 0),
    [selectedGuests, resolveGuestPrice],
  );

  function buildOptimisticBooking(values: BookingFieldsInput): CalendarBooking {
    const creatorName = knownMembers.find((m) => m.id === creatorUserId)?.name ?? "";
    return {
      id: bookingId ?? `optimistic-${crypto.randomUUID()}`,
      start: values.start,
      end: values.end,
      game: tableAllowsMultiple ? null : values.game || null,
      userId: creatorUserId,
      userName: creatorName,
      participants: [
        { userId: creatorUserId, name: creatorName },
        ...selectedParticipants.map((m) => ({ userId: m.id, name: m.name })),
      ],
      guests: selectedGuests.map((selection) => ({
        guestId: isExistingGuestSelection(selection)
          ? selection.guest.id
          : `optimistic-guest-${selection.name}`,
        name: isExistingGuestSelection(selection) ? selection.guest.name : selection.name,
        price: resolveGuestPrice(selection),
      })),
    };
  }

  function onSubmit(values: BookingFieldsInput): void {
    startTransition(async () => {
      dispatchOptimisticBooking({ type: "upsert", booking: buildOptimisticBooking(values) });

      const guests = selectedGuests.map(
        (selection): GuestInput =>
          selection.type === "existing"
            ? { guestId: selection.guest.id }
            : { newName: selection.name },
      );

      const participantUserIds = selectedParticipants.map((member) => member.id);

      const result =
        mode === DIALOG_MODE.CREATE
          ? await createBooking(tableId, { ...values, guests, participantUserIds })
          : bookingId
            ? await updateBooking(bookingId, { ...values, guests, participantUserIds })
            : null;
      if (!result) return;

      showToast(result);
      if (result.success) onClose();
    });
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tableName}: {mode === DIALOG_MODE.CREATE ? "Neue Buchung" : "Buchung bearbeiten"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Field data-invalid={!!form.formState.errors.start}>
                <FieldLabel htmlFor="start">Start</FieldLabel>
                <Controller
                  name="start"
                  control={form.control}
                  render={({ field }) => (
                    <DateTimeField id="start" value={field.value} onChange={field.onChange} />
                  )}
                />
                {form.formState.errors.start && (
                  <FieldError errors={[form.formState.errors.start]} />
                )}
              </Field>
              <Field data-invalid={!!form.formState.errors.end}>
                <FieldLabel htmlFor="end">Ende</FieldLabel>
                <Controller
                  name="end"
                  control={form.control}
                  render={({ field }) => (
                    <DateTimeField id="end" value={field.value} onChange={field.onChange} />
                  )}
                />
                {form.formState.errors.end && <FieldError errors={[form.formState.errors.end]} />}
              </Field>
            </div>

            <Field>
              <FieldLabel>Mitglieder</FieldLabel>
              <MemberMultiCombobox
                value={selectedParticipants}
                onChange={setSelectedParticipants}
                knownMembers={selectableMembers}
              />
            </Field>

            {!tableAllowsMultiple && (
              <>
                <Field>
                  <FieldLabel htmlFor="game">Spiel</FieldLabel>
                  <Controller
                    name="game"
                    control={form.control}
                    render={({ field }) => (
                      <GameCombobox
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        games={knownGames}
                      />
                    )}
                  />
                </Field>

                <Separator />
                <FieldGroup>
                  <Field>
                    <FieldLabel>Gäste</FieldLabel>
                    <GuestMultiCombobox
                      value={selectedGuests}
                      onChange={setSelectedGuests}
                      knownGuests={knownGuests}
                    />
                  </Field>
                  <p className="text-sm font-semibold">Gastkosten: {guestCost.toFixed(2)} €</p>
                </FieldGroup>
              </>
            )}

            <DialogFooter className="sm:justify-between">
              <div>
                {mode === DIALOG_MODE.EDIT && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirmCancelOpen(true)}
                    disabled={pending}
                  >
                    <CalendarX />
                    Stornieren
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  <X />
                  Abbrechen
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? <Spinner /> : <Save />}
                  Speichern
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {confirmCancelOpen && (
        <ConfirmDeleteDialog
          mode={CONFIRM_MODE.BOOKING}
          onConfirm={async () => {
            if (!bookingId) return { success: false, message: MESSAGES.BOOKING.NO_BOOKING_SELECTED };
            dispatchOptimisticBooking({ type: "remove", id: bookingId });
            const result = await cancelBooking(bookingId);
            if (result.success) onClose();
            return result;
          }}
          onClose={() => setConfirmCancelOpen(false)}
        />
      )}
    </>
  );
}
