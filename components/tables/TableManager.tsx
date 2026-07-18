"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { Table } from "@/generated/prisma/client";
import { setTableActive, deleteTable } from "@/actions/tables";
import { createTableColumns } from "./columns";
import TableFormDialog from "./TableFormDialog";

export default function TableManager({ tables }: { tables: Table[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreateDialog() {
    setEditingTable(null);
    setDialogOpen(true);
  }

  function openEditDialog(table: Table) {
    setEditingTable(table);
    setDialogOpen(true);
  }

  function handleToggleActive(table: Table) {
    startTransition(async () => {
      const result = await setTableActive(table.id, !table.active);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handleDelete(table: Table) {
    if (!confirm(`Tisch "${table.name}" wirklich löschen?`)) return;
    startTransition(async () => {
      const result = await deleteTable(table.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  const columns = useMemo(
    () =>
      createTableColumns({
        pending: isPending,
        onToggleActive: handleToggleActive,
        onEdit: openEditDialog,
        onDelete: handleDelete,
      }),
    [isPending],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus />
          Neuer Tisch
        </Button>
      </div>
      <DataTable columns={columns} data={tables} />
      {dialogOpen && (
        <TableFormDialog table={editingTable} onClose={() => setDialogOpen(false)} />
      )}
    </div>
  );
}
