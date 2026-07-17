"use client";

import { useState, useTransition } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { deleteUser } from "@/actions/users";
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

  const columns: GridColDef<AppUser>[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "E-Mail", flex: 1 },
    {
      field: "role",
      headerName: "Rolle",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.role === "admin" ? "Admin" : "Mitglied"}
          color={params.row.role === "admin" ? "secondary" : "default"}
          size="small"
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
          Neuer Benutzer
        </Button>
      </Box>
      <Box style={{ height: 500 }}>
        <DataGrid
          rows={users}
          columns={columns}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
      {dialogOpen && (
        <UserFormDialog user={editingUser} onClose={() => setDialogOpen(false)} />
      )}
    </Box>
  );
}
