"use client";

import { useTransition, type JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Table } from "@/generated/prisma/client";
import { createTable, updateTable } from "@/service/table-service/table";
import { tableFormSchema, type TableFormInput } from "@/lib/schemas/table";
import { showToast } from "@/lib/toast";

// Only rendered by the parent while the dialog should be open. The initial
// values are taken directly from props on mount (no reset effect needed).
export default function TableFormDialog({
  table,
  onClose,
}: {
  table: Table | null;
  onClose: () => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const form = useForm<TableFormInput>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: table?.name ?? "",
      autoBookingPriority: table?.autoBookingPriority?.toString() ?? "",
    },
  });

  function onSubmit(values: TableFormInput): void {
    startTransition(async () => {
      const result = table ? await updateTable(table.id, values) : await createTable(values);
      showToast(result);
      if (result.success) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{table ? "Tisch bearbeiten" : "Neuer Tisch"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input {...field} id={field.name} autoFocus aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="autoBookingPriority"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Spielersuche-Priorität</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="z.B. 1"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      Reihenfolge für die automatische Buchung (niedriger zuerst). Leer = wird nicht
                      automatisch gebucht.
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
          </FieldGroup>
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
