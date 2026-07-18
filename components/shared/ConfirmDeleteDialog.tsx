"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResult } from "@/types/action-result";

type Mode = "table" | "user" | "booking";

const COPY: Record<
  Mode,
  { title: string; confirmLabel: string; description: (name?: string) => string }
> = {
  table: {
    title: "Tisch löschen",
    confirmLabel: "Löschen",
    description: (name) => `„${name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`,
  },
  user: {
    title: "Benutzer löschen",
    confirmLabel: "Löschen",
    description: (name) => `„${name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`,
  },
  booking: {
    title: "Buchung stornieren",
    confirmLabel: "Stornieren",
    description: () => "Diese Buchung wirklich stornieren?",
  },
};

// Only rendered by the parent while it should be open — same convention as
// BookingDialog/UserFormDialog/TableFormDialog. Pending/toast handling lives
// entirely in here, scoped to this one instance, so triggering it from a
// table row never affects any other row.
export default function ConfirmDeleteDialog({
  mode,
  name,
  onConfirm,
  onClose,
}: {
  mode: Mode;
  name?: string;
  onConfirm: () => Promise<ActionResult>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const copy = COPY[mode];

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm();
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description(name)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending && <Spinner />}
            {copy.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
