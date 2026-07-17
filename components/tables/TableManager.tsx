"use client";

import { useState, useTransition } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { Table } from "@/generated/prisma/client";
import { setTableActive, deleteTable } from "@/actions/tables";
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

  const columns: GridColDef<Table>[] = [
    { field: "name", headerName: "Name", flex: 1 },
    {
      field: "active",
      headerName: "Aktiv",
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.row.active}
          onChange={() => handleToggleActive(params.row)}
        />
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Aktionen",
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Bearbeiten"
          onClick={() => openEditDialog(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Löschen"
          onClick={() => handleDelete(params.row)}
        />,
      ],
    },
  ];

  return (
    <Box className="flex flex-col gap-4">
      <Box className="flex justify-end">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Neuer Tisch
        </Button>
      </Box>
      <Box style={{ height: 500 }}>
        <DataGrid
          rows={tables}
          columns={columns}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
      {dialogOpen && (
        <TableFormDialog table={editingTable} onClose={() => setDialogOpen(false)} />
      )}
    </Box>
  );
}
