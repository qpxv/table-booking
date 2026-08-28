"use client";

import { useState, useTransition, type JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import DateTimeField from "@/components/bookings/DateTimeField";
import { eventFieldsSchema, type EventFieldsInput } from "@/lib/schemas/event";
import { createEvent, updateEvent } from "@/service/event-service/event";
import { showToast } from "@/lib/toast";
import type { ClubEvent } from "@/lib/event-types";

function defaultStart(): Date {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  return start;
}

// A day picked from the calendar comes in at midnight; default it to a
// club-evening time the admin can then adjust.
function startOnDate(date: Date): Date {
  const start = new Date(date);
  start.setHours(18, 0, 0, 0);
  return start;
}

function plusHours(date: Date, hours: number): Date {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

export default function EventFormDialog({
  event,
  initialDate,
  onClose,
}: {
  event: ClubEvent | null;
  initialDate?: Date;
  onClose: () => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const initialStart =
    event?.start ?? (initialDate ? startOnDate(initialDate) : defaultStart());
  const [hasEnd, setHasEnd] = useState(!!event?.end);

  const form = useForm<EventFieldsInput>({
    resolver: zodResolver(eventFieldsSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      location: event?.location ?? "",
      start: initialStart,
      end: event?.end ?? undefined,
    },
  });

  function toggleHasEnd(next: boolean): void {
    setHasEnd(next);
    if (next) {
      form.setValue("end", plusHours(form.getValues("start"), 2));
    } else {
      form.setValue("end", undefined);
      form.clearErrors("end");
    }
  }

  function onSubmit(values: EventFieldsInput): void {
    startTransition(async () => {
      const payload = hasEnd ? values : { ...values, end: undefined };
      const result = event
        ? await updateEvent(event.id, payload)
        : await createEvent(payload);
      showToast(result);
      if (result.success) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? "Event bearbeiten" : "Neues Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Titel</FieldLabel>
                <Input {...field} id={field.name} autoFocus aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="location"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Ort (optional)</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={field.name}
                  placeholder="z.B. Freibad Köln-Süd"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Beschreibung (optional)</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id={field.name}
                  rows={3}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Field>
            <FieldLabel htmlFor="start">Start</FieldLabel>
            <Controller
              name="start"
              control={form.control}
              render={({ field }) => (
                <DateTimeField id="start" value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>

          <div className="flex items-center gap-2">
            <Switch id="hasEnd" checked={hasEnd} onCheckedChange={toggleHasEnd} />
            <label htmlFor="hasEnd" className="text-sm">
              Endzeit festlegen
            </label>
          </div>

          {hasEnd && (
            <Field data-invalid={!!form.formState.errors.end}>
              <FieldLabel htmlFor="end">Ende</FieldLabel>
              <Controller
                name="end"
                control={form.control}
                render={({ field }) => (
                  <DateTimeField
                    id="end"
                    value={field.value ?? plusHours(form.getValues("start"), 2)}
                    onChange={field.onChange}
                  />
                )}
              />
              {form.formState.errors.end && <FieldError errors={[form.formState.errors.end]} />}
            </Field>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X />
              Abbrechen
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : <Save />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
