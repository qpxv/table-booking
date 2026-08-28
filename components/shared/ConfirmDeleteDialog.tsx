"use client";

import { useTransition, type JSX } from "react";
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
import { showToast } from "@/lib/toast";
import { CONFIRM_MODE, MESSAGES } from "@/lib/constants";
import type { ServiceResult } from "@/lib/service-types";

type Mode = (typeof CONFIRM_MODE)[keyof typeof CONFIRM_MODE];

type Copy = {
  title: string;
  confirmLabel: string;
  description: (name?: string) => string;
};

const COPY = {
  [CONFIRM_MODE.TABLE]: {
    title: MESSAGES.CONFIRM_DELETE.TABLE_TITLE,
    confirmLabel: MESSAGES.CONFIRM_DELETE.CONFIRM_LABEL_DELETE,
    description: MESSAGES.CONFIRM_DELETE.genericDeleteDescription,
  },
  [CONFIRM_MODE.USER]: {
    title: MESSAGES.CONFIRM_DELETE.USER_TITLE,
    confirmLabel: MESSAGES.CONFIRM_DELETE.CONFIRM_LABEL_DELETE,
    description: MESSAGES.CONFIRM_DELETE.genericDeleteDescription,
  },
  [CONFIRM_MODE.BOOKING]: {
    title: MESSAGES.CONFIRM_DELETE.BOOKING_TITLE,
    confirmLabel: MESSAGES.CONFIRM_DELETE.CONFIRM_LABEL_CANCEL_BOOKING,
    description: () => MESSAGES.CONFIRM_DELETE.BOOKING_DESCRIPTION,
  },
  [CONFIRM_MODE.GUEST]: {
    title: MESSAGES.CONFIRM_DELETE.GUEST_TITLE,
    confirmLabel: MESSAGES.CONFIRM_DELETE.CONFIRM_LABEL_REMOVE,
    description: MESSAGES.CONFIRM_DELETE.guestRemoveDescription,
  },
  [CONFIRM_MODE.GAME]: {
    title: MESSAGES.CONFIRM_DELETE.GAME_TITLE,
    confirmLabel: MESSAGES.CONFIRM_DELETE.CONFIRM_LABEL_DELETE,
    description: MESSAGES.CONFIRM_DELETE.genericDeleteDescription,
  },
  [CONFIRM_MODE.PLAYER_SEARCH]: {
    title: MESSAGES.CONFIRM_DELETE.PLAYER_SEARCH_TITLE,
    confirmLabel: MESSAGES.CONFIRM_DELETE.CONFIRM_LABEL_DELETE,
    description: () => MESSAGES.CONFIRM_DELETE.PLAYER_SEARCH_DESCRIPTION,
  },
  [CONFIRM_MODE.EVENT]: {
    title: MESSAGES.CONFIRM_DELETE.EVENT_TITLE,
    confirmLabel: MESSAGES.CONFIRM_DELETE.CONFIRM_LABEL_DELETE,
    description: () => MESSAGES.CONFIRM_DELETE.EVENT_DESCRIPTION,
  },
} satisfies { [K in Mode]: Copy };

// Only rendered by the parent while it should be open, same convention as
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
  onConfirm: () => Promise<ServiceResult>;
  onClose: () => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const copy = COPY[mode];

  function handleConfirm(): void {
    startTransition(async () => {
      const result = await onConfirm();
      showToast(result);
      if (result.success) onClose();
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
