"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import type { GuestWithVisits } from "@/actions/guests";
import { calculateGuestPrice } from "@/lib/pricing";
import {
  createBooking,
  updateBooking,
  cancelBooking,
  type BookingFormState,
} from "@/actions/bookings";

const COMMON_GAMES = [
  "Skat",
  "Doppelkopf",
  "Schafkopf",
  "Poker",
  "Billard",
  "Darts",
  "Sonstiges",
];

type GuestSelection =
  | { type: "existing"; guest: GuestWithVisits }
  | { type: "new"; name: string };

const initialState: BookingFormState = {};

function toDatetimeLocal(iso: string): string {
  // Truncates an ISO date to the format <input type="datetime-local"> expects.
  return iso.slice(0, 16);
}

// Only rendered by the parent while the dialog should be open — the initial
// values are taken directly from props on mount (no reset effect needed).
export default function BookingDialog({
  mode,
  tableId,
  tableName,
  bookingId,
  initialStart,
  initialEnd,
  knownGuests,
  onClose,
}: {
  mode: "create" | "edit";
  tableId: string;
  tableName: string;
  bookingId?: string;
  initialStart: string;
  initialEnd: string;
  knownGuests: GuestWithVisits[];
  onClose: () => void;
}) {
  const [game, setGame] = useState<string | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<GuestSelection[]>([]);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelPending, startCancelTransition] = useTransition();

  const action =
    mode === "create" ? createBooking.bind(null, tableId) : updateBooking.bind(null, bookingId!);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  const guestCost = useMemo(() => {
    return selectedGuests.reduce((total, selection) => {
      const previousVisitCount = selection.type === "existing" ? selection.guest.visitCount : 0;
      return total + calculateGuestPrice(previousVisitCount);
    }, 0);
  }, [selectedGuests]);

  const guestsJson = useMemo(
    () =>
      JSON.stringify(
        selectedGuests.map((selection) =>
          selection.type === "existing"
            ? { guestId: selection.guest.id }
            : { newName: selection.name },
        ),
      ),
    [selectedGuests],
  );

  function handleCancel() {
    if (!bookingId) return;
    if (!confirm("Diese Buchung wirklich stornieren?")) return;
    setCancelError(null);
    startCancelTransition(async () => {
      try {
        await cancelBooking(bookingId);
        onClose();
      } catch (err) {
        setCancelError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
      }
    });
  }

  const errorMessage = state.error ?? cancelError;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" action={formAction}>
        <DialogTitle>
          {tableName} — {mode === "create" ? "Neue Buchung" : "Buchung bearbeiten"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 !pt-2">
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Box className="flex gap-3">
            <TextField
              name="start"
              label="Start"
              type="datetime-local"
              defaultValue={toDatetimeLocal(initialStart)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              name="end"
              label="Ende"
              type="datetime-local"
              defaultValue={toDatetimeLocal(initialEnd)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Autocomplete
            freeSolo
            options={COMMON_GAMES}
            value={game}
            onInputChange={(_event, value) => setGame(value)}
            renderInput={(params) => <TextField {...params} label="Spiel" />}
          />
          <input type="hidden" name="game" value={game ?? ""} />

          {mode === "create" && (
            <>
              <Divider />
              <Typography variant="subtitle2">Gäste</Typography>
              <Autocomplete
                multiple
                freeSolo
                options={knownGuests}
                value={selectedGuests.map((selection) =>
                  selection.type === "existing" ? selection.guest : selection.name,
                )}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.name
                }
                isOptionEqualToValue={(option, value) =>
                  typeof option !== "string" &&
                  typeof value !== "string" &&
                  option.id === value.id
                }
                renderOption={(props, option) => {
                  if (typeof option === "string") {
                    return (
                      <li {...props} key={option}>
                        {option}
                      </li>
                    );
                  }
                  return (
                    <li {...props} key={option.id}>
                      {option.name}{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        className="ml-1"
                      >
                        ({option.hasVisitedBefore ? "schon da gewesen" : "erstes Mal"})
                      </Typography>
                    </li>
                  );
                }}
                onChange={(_event, values) => {
                  setSelectedGuests(
                    values.map((value) =>
                      typeof value === "string"
                        ? { type: "new" as const, name: value }
                        : { type: "existing" as const, guest: value },
                    ),
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Gäste hinzufügen"
                    placeholder="Bekannten Gast wählen oder neuen Namen eingeben"
                  />
                )}
              />
              <input type="hidden" name="guestsJson" value={guestsJson} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Gastkosten: {guestCost.toFixed(2)} €
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions className="flex justify-between !px-6">
          <Box>
            {mode === "edit" && (
              <Button
                type="button"
                color="error"
                onClick={handleCancel}
                disabled={pending || cancelPending}
              >
                Stornieren
              </Button>
            )}
          </Box>
          <Box className="flex gap-2">
            <Button type="button" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" variant="contained" disabled={pending || cancelPending}>
              Speichern
            </Button>
          </Box>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
