"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import ResetPasswordDialog from "./ResetPasswordDialog";
import { deleteUser } from "@/actions/users";
import { deleteGuest, type MemberGuestSummary } from "@/actions/guests";
import { createUserColumns } from "./columns";
import UserFormDialog, { type AppUser } from "./UserFormDialog";

export default function UserManager({ users }: { users: AppUser[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AppUser | null>(null);
  const [removeGuestTarget, setRemoveGuestTarget] = useState<MemberGuestSummary | null>(null);

  function openCreateDialog() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: AppUser) {
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
          mode="user"
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
          mode="guest"
          name={removeGuestTarget.name}
          onConfirm={() => deleteGuest(removeGuestTarget.id)}
          onClose={() => setRemoveGuestTarget(null)}
        />
      )}
    </div>
  );
}
