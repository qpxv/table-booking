"use client";

import { useTransition, type JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import DateTimeField from "@/components/bookings/DateTimeField";
import {
  counterPlayerSearchFieldsSchema,
  type CounterPlayerSearchFieldsInput,
} from "@/lib/schemas/player-search";
import { counterPlayerSearchInterest } from "@/service/player-search-service/player-search";
import { showToast } from "@/lib/toast";

export default function PlayerSearchCounterDialog({
  interestId,
  initialStart,
  initialEnd,
  onClose,
}: {
  interestId: string;
  initialStart: Date;
  initialEnd: Date;
  onClose: () => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const form = useForm<CounterPlayerSearchFieldsInput>({
    resolver: zodResolver(counterPlayerSearchFieldsSchema),
    defaultValues: { start: initialStart, end: initialEnd, note: "" },
  });

  function onSubmit(values: CounterPlayerSearchFieldsInput): void {
    startTransition(async () => {
      const result = await counterPlayerSearchInterest(interestId, values);
      showToast(result);
      if (result.success) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gegenvorschlag</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Field data-invalid={!!form.formState.errors.start}>
              <FieldLabel htmlFor="start">Von</FieldLabel>
              <Controller
                name="start"
                control={form.control}
                render={({ field }) => (
                  <DateTimeField
                    id="start"
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next);
                      const nextEnd = new Date(next);
                      nextEnd.setHours(nextEnd.getHours() + 3);
                      form.setValue("end", nextEnd, { shouldValidate: true });
                    }}
                  />
                )}
              />
              {form.formState.errors.start && (
                <FieldError errors={[form.formState.errors.start]} />
              )}
            </Field>
            <Field data-invalid={!!form.formState.errors.end}>
              <FieldLabel htmlFor="end">Bis</FieldLabel>
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

          <Controller
            name="note"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Notiz (optional)</FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={3}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X />
              Abbrechen
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : <Send />}
              Vorschlagen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
