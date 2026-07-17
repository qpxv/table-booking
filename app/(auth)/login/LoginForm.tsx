"use client";

import { useActionState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { signIn } from "@/actions/auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, {});

  return (
    <Box
      component="form"
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      {state.error && <Alert severity="error">{state.error}</Alert>}
      <TextField
        name="email"
        label="E-Mail"
        type="email"
        required
        fullWidth
      />
      <TextField
        name="password"
        label="Passwort"
        type="password"
        required
        fullWidth
      />
      <Button type="submit" variant="contained" color="primary" disabled={pending}>
        Anmelden
      </Button>
    </Box>
  );
}
