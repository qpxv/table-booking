"use client";

import { useActionState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import type { Table } from "@/generated/prisma/client";
import { createTable, updateTable, type TableFormState } from "@/actions/tables";

const initialState: TableFormState = {};

// Only rendered by the parent while the dialog should be open — the initial
// values are taken directly from props on mount (no reset effect needed).
export default function TableFormDialog({
  table,
  onClose,
}: {
  table: Table | null;
  onClose: () => void;
}) {
  const action = table ? updateTable.bind(null, table.id) : createTable;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <Box component="form" action={formAction}>
        <DialogTitle>{table ? "Tisch bearbeiten" : "Neuer Tisch"}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 !pt-2">
          {state.error && <Alert severity="error">{state.error}</Alert>}
          <TextField
            autoFocus
            name="name"
            label="Name"
            defaultValue={table?.name ?? ""}
            required
            fullWidth
            margin="dense"
          />
          <FormControlLabel
            control={
              <Switch name="active" defaultChecked={table?.active ?? true} />
            }
            label="Aktiv"
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            Speichern
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
