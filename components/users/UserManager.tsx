"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { deleteUser } from "@/actions/users";
import { createUserColumns } from "./columns";
import UserFormDialog, { type AppUser } from "./UserFormDialog";

export default function UserManager({ users }: { users: AppUser[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [, startTransition] = useTransition();

  function openCreateDialog() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: AppUser) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function handleDelete(user: AppUser) {
    if (!confirm(`Benutzer "${user.name}" wirklich löschen?`)) return;
    startTransition(async () => {
      await deleteUser(user.id);
    });
  }

  const columns = useMemo(
    () => createUserColumns({ onEdit: openEditDialog, onDelete: handleDelete }),
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
    </div>
  );
}
