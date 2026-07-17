"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { Table } from "@/generated/prisma/client";
import { setTableActive, deleteTable } from "@/actions/tables";
import { createTableColumns } from "./columns";
import TableFormDialog from "./TableFormDialog";

export default function TableManager({ tables }: { tables: Table[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [, startTransition] = useTransition();

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
      await setTableActive(table.id, !table.active);
    });
  }

  function handleDelete(table: Table) {
    if (!confirm(`Tisch "${table.name}" wirklich löschen?`)) return;
    startTransition(async () => {
      await deleteTable(table.id);
    });
  }

  const columns = useMemo(
    () =>
      createTableColumns({
        onToggleActive: handleToggleActive,
        onEdit: openEditDialog,
        onDelete: handleDelete,
      }),
    [],
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
