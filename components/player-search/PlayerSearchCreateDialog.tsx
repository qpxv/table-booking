"use client";

import { useTransition, type JSX } from "react";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateTimeField from "@/components/bookings/DateTimeField";
import GameCombobox from "@/components/bookings/GameCombobox";
import { MATCH_TYPE_OPTIONS } from "@/lib/player-search-types";
import {
  playerSearchFieldsSchema,
  type PlayerSearchFieldsInput,
} from "@/lib/schemas/player-search";
import { createPlayerSearch } from "@/service/player-search-service/player-search";
import { showToast } from "@/lib/toast";

function defaultRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 3);
  return { start, end };
}

export default function PlayerSearchCreateDialog({
  games,
  onClose,
}: {
  games: { id: string; name: string }[];
  onClose: () => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const { start, end } = defaultRange();
  const form = useForm<PlayerSearchFieldsInput>({
    resolver: zodResolver(playerSearchFieldsSchema),
    defaultValues: { start, end, system: "", matchType: "fun" },
  });

  function onSubmit(values: PlayerSearchFieldsInput): void {
    startTransition(async () => {
      const result = await createPlayerSearch(values);
      showToast(result);
      if (result.success) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Spielersuche</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Field data-invalid={!!form.formState.errors.start}>
              <FieldLabel htmlFor="start">Von</FieldLabel>
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
            name="system"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="system">System</FieldLabel>
                <GameCombobox value={field.value} onChange={field.onChange} games={games} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="matchType"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="matchType">Spieltyp</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="matchType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {pending ? <Spinner /> : <Save />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
