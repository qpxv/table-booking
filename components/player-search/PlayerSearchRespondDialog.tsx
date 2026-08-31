"use client";

import { useState, useTransition, type JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Handshake, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import DateTimeField from "@/components/bookings/DateTimeField";
import { formatBerlin } from "@/lib/datetime";
import {
  respondPlayerSearchFieldsSchema,
  type RespondPlayerSearchFieldsInput,
} from "@/lib/schemas/player-search";
import { respondToPlayerSearch } from "@/service/player-search-service/player-search";
import { showToast } from "@/lib/toast";
import type { OpenPlayerSearch } from "@/lib/queries/player-search";

function defaultRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 3);
  return { start, end };
}

export default function PlayerSearchRespondDialog({
  search,
  onClose,
}: {
  search: OpenPlayerSearch;
  onClose: () => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const fixedWindow =
    search.start !== null && search.end !== null
      ? { start: search.start, end: search.end }
      : null;
  const isFlexible = fixedWindow === null;
  const fallback = defaultRange();
  const initialStart = fixedWindow?.start ?? fallback.start;
  const initialEnd = fixedWindow?.end ?? fallback.end;

  const [suggestTime, setSuggestTime] = useState(isFlexible);
  const form = useForm<RespondPlayerSearchFieldsInput>({
    resolver: zodResolver(respondPlayerSearchFieldsSchema),
    defaultValues: { proposedStart: initialStart, proposedEnd: initialEnd, note: "" },
  });

  function onSubmit(values: RespondPlayerSearchFieldsInput): void {
    startTransition(async () => {
      const result = await respondToPlayerSearch(search.id, {
        note: values.note,
        proposedStart: suggestTime ? values.proposedStart : undefined,
        proposedEnd: suggestTime ? values.proposedEnd : undefined,
      });
      showToast(result);
      if (result.success) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {search.system} {search.matchType} mit {search.creatorName}
          </DialogTitle>
          <DialogDescription>
            {fixedWindow ? (
              <>
                {formatBerlin(fixedWindow.start, "dd.MM.yyyy")},{" "}
                {formatBerlin(fixedWindow.start, "HH:mm")} – {formatBerlin(fixedWindow.end, "HH:mm")}{" "}
                Uhr. Der Ersteller entscheidet, ob ihr spielt. Bei Zusage wird automatisch ein freier
                Tisch gebucht.
              </>
            ) : (
              <>Zeit nach Absprache: schlage einen Termin vor. Der Ersteller entscheidet, ob ihr spielt.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {!isFlexible && (
            <div className="flex items-center gap-2">
              <Switch id="suggestTime" checked={suggestTime} onCheckedChange={setSuggestTime} />
              <label htmlFor="suggestTime" className="text-sm">
                Andere Uhrzeit vorschlagen
              </label>
            </div>
          )}

          {suggestTime && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Field data-invalid={!!form.formState.errors.proposedStart}>
                <FieldLabel htmlFor="proposedStart">Von</FieldLabel>
                <Controller
                  name="proposedStart"
                  control={form.control}
                  render={({ field }) => (
                    <DateTimeField
                      id="proposedStart"
                      value={field.value}
                      onChange={(next) => {
                        field.onChange(next);
                        const nextEnd = new Date(next);
                        nextEnd.setHours(nextEnd.getHours() + 3);
                        form.setValue("proposedEnd", nextEnd, { shouldValidate: true });
                      }}
                    />
                  )}
                />
                {form.formState.errors.proposedStart && (
                  <FieldError errors={[form.formState.errors.proposedStart]} />
                )}
              </Field>
              <Field data-invalid={!!form.formState.errors.proposedEnd}>
                <FieldLabel htmlFor="proposedEnd">Bis</FieldLabel>
                <Controller
                  name="proposedEnd"
                  control={form.control}
                  render={({ field }) => (
                    <DateTimeField
                      id="proposedEnd"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {form.formState.errors.proposedEnd && (
                  <FieldError errors={[form.formState.errors.proposedEnd]} />
                )}
              </Field>
            </div>
          )}

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
                  placeholder="Optionale Nachricht an den Ersteller"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X />
              Abbruch
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : <Handshake />}
              Senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
