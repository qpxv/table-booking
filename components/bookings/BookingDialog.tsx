"use client";

import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import GameCombobox from "./GameCombobox";
import GuestMultiCombobox, { type GuestSelection } from "./GuestMultiCombobox";
import type { GuestWithVisits } from "@/actions/guests";
import { calculateGuestPrice } from "@/lib/pricing";
import {
  bookingFieldsSchema,
  type BookingFieldsInput,
  type GuestInput,
} from "@/lib/schemas/booking";
import { createBooking, updateBooking, cancelBooking } from "@/actions/bookings";

function toDatetimeLocal(iso: string): string {
  // Truncates an ISO date to the format <input type="datetime-local"> expects.
  return iso.slice(0, 16);
}

// Only rendered by the parent while the dialog should be open — the initial
// values are taken directly from props on mount (no reset effect needed).
export default function BookingDialog({
  mode,
  tableId,
  tableName,
  bookingId,
  initialStart,
  initialEnd,
  knownGuests,
  onClose,
}: {
  mode: "create" | "edit";
  tableId: string;
  tableName: string;
  bookingId?: string;
  initialStart: string;
  initialEnd: string;
  knownGuests: GuestWithVisits[];
  onClose: () => void;
}) {
  const [selectedGuests, setSelectedGuests] = useState<GuestSelection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [cancelPending, startCancelTransition] = useTransition();

  const form = useForm<BookingFieldsInput>({
    resolver: zodResolver(bookingFieldsSchema),
    defaultValues: {
      start: toDatetimeLocal(initialStart),
      end: toDatetimeLocal(initialEnd),
      game: "",
    },
  });

  const guestCost = useMemo(() => {
    return selectedGuests.reduce((total, selection) => {
      const previousVisitCount = selection.type === "existing" ? selection.guest.visitCount : 0;
      return total + calculateGuestPrice(previousVisitCount);
    }, 0);
  }, [selectedGuests]);

  function onSubmit(values: BookingFieldsInput) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createBooking(tableId, {
              ...values,
              guests: selectedGuests.map(
                (selection): GuestInput =>
                  selection.type === "existing"
                    ? { guestId: selection.guest.id }
                    : { newName: selection.name },
              ),
            })
          : await updateBooking(bookingId!, values);

      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleCancel() {
    if (!bookingId) return;
    if (!confirm("Diese Buchung wirklich stornieren?")) return;
    setError(null);
    startCancelTransition(async () => {
      try {
        await cancelBooking(bookingId);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {tableName} — {mode === "create" ? "Neue Buchung" : "Buchung bearbeiten"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Field data-invalid={!!form.formState.errors.start}>
              <FieldLabel htmlFor="start">Start</FieldLabel>
              <Input id="start" type="datetime-local" {...form.register("start")} />
              {form.formState.errors.start && (
                <FieldError errors={[form.formState.errors.start]} />
              )}
            </Field>
            <Field data-invalid={!!form.formState.errors.end}>
              <FieldLabel htmlFor="end">Ende</FieldLabel>
              <Input id="end" type="datetime-local" {...form.register("end")} />
              {form.formState.errors.end && <FieldError errors={[form.formState.errors.end]} />}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="game">Spiel</FieldLabel>
            <Controller
              name="game"
              control={form.control}
              render={({ field }) => (
                <GameCombobox value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </Field>

          {mode === "create" && (
            <>
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
                  onClick={handleCancel}
                  disabled={pending || cancelPending}
                >
                  Stornieren
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={pending || cancelPending}>
                Speichern
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
