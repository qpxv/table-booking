"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Game } from "@/generated/prisma/client";
import { createGame, updateGame } from "@/actions/games";
import { gameSchema, type GameInput } from "@/lib/schemas/game";

// Only rendered by the parent while the dialog should be open — the initial
// values are taken directly from props on mount (no reset effect needed).
export default function GameFormDialog({
  game,
  onClose,
}: {
  game: Game | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<GameInput>({
    resolver: zodResolver(gameSchema),
    defaultValues: { name: game?.name ?? "" },
  });

  function onSubmit(values: GameInput) {
    startTransition(async () => {
      const result = game ? await updateGame(game.id, values) : await createGame(values);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{game ? "Spiel bearbeiten" : "Neues Spiel"}</DialogTitle>
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
