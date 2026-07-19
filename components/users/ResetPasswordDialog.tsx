"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { resetUserPassword } from "@/actions/users";
import type { AppUser } from "./UserFormDialog";

const resetPasswordFormSchema = z
  .object({
    newPassword: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
    confirmPassword: z.string().min(1, "Bitte Passwort bestätigen"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });
type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

// Only rendered by the parent while the dialog should be open, same
// convention as the other dialogs in the app.
export default function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: AppUser;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordFormInput) {
    startTransition(async () => {
      const result = await resetUserPassword(user.id, { newPassword: values.newPassword });
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
          <DialogTitle>Passwort zurücksetzen für {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Neues Passwort</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    autoFocus
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Mindestens 8 Zeichen</p>
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Neues Passwort bestätigen</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Passwort zurücksetzen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
