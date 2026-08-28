"use client";

import { useTransition, type JSX } from "react";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatBerlin } from "@/lib/datetime";
import { matchTypeLabel } from "@/lib/player-search-types";
import {
  respondPlayerSearchSchema,
  type RespondPlayerSearchInput,
} from "@/lib/schemas/player-search";
import { respondToPlayerSearch } from "@/service/player-search-service/player-search";
import { showToast } from "@/lib/toast";
import type { OpenPlayerSearch } from "@/lib/queries/player-search";

export default function PlayerSearchRespondDialog({
  search,
  onClose,
}: {
  search: OpenPlayerSearch;
  onClose: () => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const form = useForm<RespondPlayerSearchInput>({
    resolver: zodResolver(respondPlayerSearchSchema),
    defaultValues: { note: "" },
  });

  function onSubmit(values: RespondPlayerSearchInput): void {
    startTransition(async () => {
      const result = await respondToPlayerSearch(search.id, values);
      showToast(result);
      if (result.success) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {search.system} {matchTypeLabel(search.matchType)} mit {search.creatorName}
          </DialogTitle>
          <DialogDescription>
            {formatBerlin(search.start, "dd.MM.yyyy")}, {formatBerlin(search.start, "HH:mm")} –{" "}
            {formatBerlin(search.end, "HH:mm")} Uhr. Bei Zusage wird automatisch ein freier Tisch
            gebucht.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                  placeholder="Yo lass ma 2k chillig spielen"
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
