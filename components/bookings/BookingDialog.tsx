"use client";

import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import GuestMultiCombobox, { type GuestSelection } from "./GuestMultiCombobox";
import type { GuestWithVisits } from "@/actions/guests";
import type { Game } from "@/generated/prisma/client";
import { calculateGuestPrice } from "@/lib/pricing";
import {
  bookingFieldsSchema,
  type BookingFieldsInput,
  type GuestInput,
} from "@/lib/schemas/booking";
import { createBooking, updateBooking, cancelBooking } from "@/actions/bookings";

// Only rendered by the parent while the dialog should be open — the initial
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
  knownGuests,
  knownGames,
  tableAllowsMultiple,
  onClose,
}: {
  mode: "create" | "edit";
  tableId: string;
  tableName: string;
  bookingId?: string;
  initialStart: string;
  initialEnd: string;
  initialGame?: string;
  initialGuests?: GuestSelection[];
  knownGuests: GuestWithVisits[];
  knownGames: Pick<Game, "id" | "name">[];
  tableAllowsMultiple: boolean;
  onClose: () => void;
}) {
  const [selectedGuests, setSelectedGuests] = useState<GuestSelection[]>(initialGuests ?? []);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<BookingFieldsInput>({
    resolver: zodResolver(bookingFieldsSchema),
    defaultValues: {
      start: new Date(initialStart),
      end: new Date(initialEnd),
      game: initialGame ?? "",
    },
  });

  const guestCost = useMemo(() => {
    return selectedGuests.reduce((total, selection) => {
      const previousVisitCount = selection.type === "existing" ? selection.guest.visitCount : 0;
      return total + calculateGuestPrice(previousVisitCount);
    }, 0);
  }, [selectedGuests]);

  function onSubmit(values: BookingFieldsInput) {
    startTransition(async () => {
      const guests = selectedGuests.map(
        (selection): GuestInput =>
          selection.type === "existing"
            ? { guestId: selection.guest.id }
            : { newName: selection.name },
      );

      const result =
        mode === "create"
          ? await createBooking(tableId, { ...values, guests })
          : await updateBooking(bookingId!, { ...values, guests });

      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tableName} — {mode === "create" ? "Neue Buchung" : "Buchung bearbeiten"}
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
                {mode === "edit" && (
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
          mode="booking"
          onConfirm={async () => {
            const result = await cancelBooking(bookingId!);
            if (result.success) onClose();
            return result;
          }}
          onClose={() => setConfirmCancelOpen(false)}
        />
      )}
    </>
  );
}
