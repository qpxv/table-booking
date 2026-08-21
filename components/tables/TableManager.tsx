"use client";

import { useMemo, useState, useTransition, type JSX } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Table } from "@/generated/prisma/client";
import {
  setTableActive,
  setTableAllowMultipleBookings,
  deleteTable,
} from "@/service/table-service/table";
import { showToast } from "@/lib/toast";
import { CONFIRM_MODE } from "@/lib/constants";
import { createTableColumns } from "./columns";
import TableFormDialog from "./TableFormDialog";

export default function TableManager({ tables }: { tables: Table[] }): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreateDialog(): void {
    setEditingTable(null);
    setDialogOpen(true);
  }

  function openEditDialog(table: Table): void {
    setEditingTable(table);
    setDialogOpen(true);
  }

  function handleToggleActive(table: Table): void {
    startTransition(async () => {
      const result = await setTableActive(table.id, !table.active);
      showToast(result);
    });
  }

  function handleToggleMultiple(table: Table): void {
    startTransition(async () => {
      const result = await setTableAllowMultipleBookings(table.id, !table.allowMultipleBookings);
      showToast(result);
    });
  }

  const columns = useMemo(
    () =>
      createTableColumns({
        pending: isPending,
        onToggleActive: handleToggleActive,
        onToggleMultiple: handleToggleMultiple,
        onEdit: openEditDialog,
        onDelete: setDeleteTarget,
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
      {deleteTarget && (
        <ConfirmDeleteDialog
          mode={CONFIRM_MODE.TABLE}
          name={deleteTarget.name}
          onConfirm={() => deleteTable(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
