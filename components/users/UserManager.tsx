"use client";

import { useMemo, useState, type JSX } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import ResetPasswordDialog from "./ResetPasswordDialog";
import { deleteUser } from "@/service/user-service/user";
import { deleteGuest } from "@/service/guest-service/guest";
import type { MemberGuestSummary } from "@/lib/guest-types";
import { createUserColumns } from "./columns";
import UserFormDialog from "./UserFormDialog";
import type { AppUser } from "@/lib/user-types";
import { CONFIRM_MODE } from "@/lib/constants";

export default function UserManager({ users }: { users: AppUser[] }): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AppUser | null>(null);
  const [removeGuestTarget, setRemoveGuestTarget] = useState<MemberGuestSummary | null>(null);

  function openCreateDialog(): void {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: AppUser): void {
    setEditingUser(user);
    setDialogOpen(true);
  }

  const columns = useMemo(
    () =>
      createUserColumns({
        onEdit: openEditDialog,
        onResetPassword: setResetPasswordTarget,
        onDelete: setDeleteTarget,
        onRemoveGuest: setRemoveGuestTarget,
      }),
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus />
          Neuer Benutzer
        </Button>
      </div>
      <DataTable columns={columns} data={users} />
      {dialogOpen && (
        <UserFormDialog user={editingUser} onClose={() => setDialogOpen(false)} />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog
          mode={CONFIRM_MODE.USER}
          name={deleteTarget.name}
          onConfirm={() => deleteUser(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {resetPasswordTarget && (
        <ResetPasswordDialog
          user={resetPasswordTarget}
          onClose={() => setResetPasswordTarget(null)}
        />
      )}
      {removeGuestTarget && (
        <ConfirmDeleteDialog
          mode={CONFIRM_MODE.GUEST}
          name={removeGuestTarget.name}
          onConfirm={() => deleteGuest(removeGuestTarget.id)}
          onClose={() => setRemoveGuestTarget(null)}
        />
      )}
    </div>
  );
}
