"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { UserCircle, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

type Tab = "profile" | "password";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  email: z.email("Ungültige E-Mail-Adresse"),
});
type ProfileInput = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
    newPassword: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
    confirmPassword: z.string().min(1, "Bitte Passwort bestätigen"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });
type PasswordInput = z.infer<typeof passwordSchema>;

// Only rendered by the parent while the dialog should be open, same
// convention as BookingDialog/UserFormDialog/TableFormDialog.
export default function SettingsDialog({
  name,
  email,
  onClose,
}: {
  name: string;
  email: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 sm:flex-row">
          <nav className="flex shrink-0 flex-row gap-1 sm:w-44 sm:flex-col">
            <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
              <UserCircle />
              Persönliche Daten
            </TabButton>
            <TabButton active={tab === "password"} onClick={() => setTab("password")}>
              <KeyRound />
              Passwort ändern
            </TabButton>
          </nav>
          <div className="min-w-0 grow">
            {tab === "profile" ? (
              <ProfileForm name={name} email={email} />
            ) : (
              <PasswordForm />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm [&_svg]:size-4 [&_svg]:shrink-0",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, email },
  });

  function onSubmit(values: ProfileInput) {
    startTransition(async () => {
      if (values.name !== name) {
        const { error } = await authClient.updateUser({ name: values.name });
        if (error) {
          toast.error(error.message ?? "Ein Fehler ist aufgetreten.");
          return;
        }
      }

      if (values.email !== email) {
        const { error } = await authClient.changeEmail({ newEmail: values.email });
        if (error) {
          toast.error(error.message ?? "Ein Fehler ist aufgetreten.");
          return;
        }
      }

      toast.success("Profil aktualisiert.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>E-Mail</FieldLabel>
              <Input {...field} id={field.name} type="email" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" disabled={pending} className="self-end">
        {pending && <Spinner />}
        Änderungen speichern
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: PasswordInput) {
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (error) {
        toast.error(error.message ?? "Ein Fehler ist aufgetreten.");
        return;
      }

      toast.success("Passwort geändert.");
      form.reset();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup>
        <Controller
          name="currentPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Aktuelles Passwort</FieldLabel>
              <Input {...field} id={field.name} type="password" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="newPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Neues Passwort</FieldLabel>
              <Input {...field} id={field.name} type="password" aria-invalid={fieldState.invalid} />
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
              <Input {...field} id={field.name} type="password" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" disabled={pending} className="self-end">
        {pending && <Spinner />}
        Passwort ändern
      </Button>
    </form>
  );
}
