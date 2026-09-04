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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import DateTimeField from "@/components/bookings/DateTimeField";
import GameCombobox from "@/components/bookings/GameCombobox";
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
  const [fixedTime, setFixedTime] = useState(true);
  const { start, end } = defaultRange();
  const form = useForm<PlayerSearchFieldsInput>({
    resolver: zodResolver(playerSearchFieldsSchema),
    defaultValues: { start, end, system: "", matchType: "", playerCount: 2 },
  });

  function onSubmit(values: PlayerSearchFieldsInput): void {
    startTransition(async () => {
      const result = await createPlayerSearch(
        fixedTime
          ? {
              fixedTime: true,
              start: values.start,
              end: values.end,
              system: values.system,
              matchType: values.matchType,
              playerCount: values.playerCount,
            }
          : {
              fixedTime: false,
              system: values.system,
              matchType: values.matchType,
              playerCount: values.playerCount,
            },
      );
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
          <div className="flex items-center gap-2">
            <Switch
              id="fixedTime"
              checked={fixedTime}
              onCheckedChange={(next) => {
                setFixedTime(next);
                if (!next) form.clearErrors(["start", "end"]);
              }}
            />
            <label htmlFor="fixedTime" className="text-sm">
              Feste Uhrzeit
            </label>
          </div>

          {fixedTime ? (
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
          ) : (
            <p className="text-sm text-muted-foreground">
              Ohne feste Uhrzeit: Interessenten schlagen einen Termin vor, den ihr dann abstimmt.
            </p>
          )}

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
                <FieldLabel htmlFor={field.name}>Spieltyp</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="z. B. 2000 Punkte, gemütlich"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="playerCount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Anzahl Spieler</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={2}
                  max={8}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                <p className="text-xs text-muted-foreground">
                  Zähl dich selbst mit. Bei mehr als 2 Spielern können weitere mitmachen, sobald der
                  erste Termin steht, bis die Runde voll ist.
                </p>
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
