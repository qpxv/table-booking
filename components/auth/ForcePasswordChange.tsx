"use client";

import { useTransition, type JSX } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSignOut } from "@/hooks/use-sign-out";
import { showToast } from "@/lib/toast";
import { MESSAGES } from "@/lib/constants";
import { completeForcedPasswordChange } from "@/service/user-service/account";
import { resetPasswordFormSchema, type ResetPasswordFormInput } from "@/lib/schemas/user";

// Rendered by app/(app)/layout.tsx in place of the app whenever the member's
// account still carries an admin-provisioned password. Non-dismissible: the
// only ways out are setting a password or signing out.
export default function ForcePasswordChange({ userName }: { userName: string }): JSX.Element {
  const router = useRouter();
  const handleLogout = useSignOut();
  const [pending, startTransition] = useTransition();
  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordFormInput): void {
    startTransition(async () => {
      const result = await completeForcedPasswordChange({ newPassword: values.newPassword });
      showToast(result);
      if (result.success) router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{MESSAGES.FORCE_PASSWORD_CHANGE.TITLE}</DialogTitle>
          <DialogDescription>
            Hallo {userName}. {MESSAGES.FORCE_PASSWORD_CHANGE.DESCRIPTION}
          </DialogDescription>
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
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Passwort festlegen
            </Button>
            <Button type="button" variant="ghost" onClick={handleLogout}>
              <LogOut />
              Abmelden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
