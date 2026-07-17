"use client";

import { useActionState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { createUser, updateUser, type UserFormState } from "@/actions/users";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role?: string | string[] | null;
};

const initialState: UserFormState = {};

// Only rendered by the parent while the dialog should be open — the initial
// values are taken directly from props on mount (no reset effect needed).
export default function UserFormDialog({
  user,
  onClose,
}: {
  user: AppUser | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(user);
  const action = user ? updateUser.bind(null, user.id) : createUser;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <Box component="form" action={formAction}>
        <DialogTitle>{isEdit ? "Benutzer bearbeiten" : "Neuer Benutzer"}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 !pt-2">
          {state.error && <Alert severity="error">{state.error}</Alert>}
          <TextField
            autoFocus
            name="name"
            label="Name"
            defaultValue={user?.name ?? ""}
            required
            fullWidth
            margin="dense"
          />
          <TextField
            name="email"
            label="E-Mail"
            type="email"
            defaultValue={user?.email ?? ""}
            required
            fullWidth
            margin="dense"
            disabled={isEdit}
          />
          {!isEdit && (
            <TextField
              name="password"
              label="Passwort"
              type="password"
              required
              fullWidth
              margin="dense"
              helperText="Mindestens 8 Zeichen"
            />
          )}
          <TextField
            select
            name="role"
            label="Rolle"
            defaultValue={user?.role === "admin" ? "admin" : "user"}
            fullWidth
            margin="dense"
          >
            <MenuItem value="user">Mitglied</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
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
