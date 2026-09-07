"use client";

import { useState, useTransition, type JSX } from "react";
import { Check, LogIn, LogOut, Pencil, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatBerlin } from "@/lib/datetime";
import {
  joinBooking,
  leaveBooking,
  updateParticipantActivity,
} from "@/service/booking-service/booking";
import { showToast } from "@/lib/toast";
import type { CalendarBooking } from "@/lib/booking-types";

const ACTIVITY_MAX_LENGTH = 80;

// Shown when clicking any event, on any table, instead of jumping straight
// to the edit dialog: any member can join/leave here; only the creator or
// an admin can jump to the full edit dialog to reschedule/cancel. The
// creator never gets a Verlassen button: they can't leave their own event.
export default function BookingJoinDialog({
  tableName,
  booking,
  currentUserId,
  tableAllowsMultiple,
  canEdit,
  onEdit,
  onClose,
}: {
  tableName: string;
  booking: CalendarBooking;
  currentUserId: string;
  tableAllowsMultiple: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const isCreator = booking.userId === currentUserId;
  const myParticipant = booking.participants.find((p) => p.userId === currentUserId);
  const isParticipant = myParticipant !== undefined;

  const [activity, setActivity] = useState(myParticipant?.activity ?? "");
  const activityChanged = activity.trim() !== (myParticipant?.activity ?? "");

  function handleJoin(): void {
    startTransition(async () => {
      const result = await joinBooking(booking.id, activity.trim() || undefined);
      showToast(result);
      if (result.success) onClose();
    });
  }

  function handleLeave(): void {
    startTransition(async () => {
      const result = await leaveBooking(booking.id);
      showToast(result);
      if (result.success) onClose();
    });
  }

  function handleSaveActivity(): void {
    startTransition(async () => {
      const result = await updateParticipantActivity(booking.id, activity.trim());
      showToast(result);
      if (result.success) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tableName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {formatBerlin(booking.start)} – {formatBerlin(booking.end, "HH:mm")}
          </p>
          {booking.game && (
            <div>
              <p className="mb-1.5 text-sm font-medium">Spiel</p>
              <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-sm">
                {booking.game}
              </span>
            </div>
          )}
          {booking.note && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">{booking.note}</p>
          )}
          <div>
            <p className="mb-1.5 text-sm font-medium">
              {booking.participants.length === 1
                ? "1 Mitglied"
                : `${booking.participants.length} Mitglieder`}
            </p>
            <ul className="flex flex-col gap-1.5">
              {booking.participants.map((participant) => (
                <li
                  key={participant.userId}
                  className="rounded-lg bg-muted px-2.5 py-1 text-sm"
                >
                  <span>{participant.name}</span>
                  {participant.activity && (
                    <span className="block text-xs text-muted-foreground">
                      {participant.activity}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {booking.guests.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium">
                {booking.guests.length === 1 ? "1 Gast" : `${booking.guests.length} Gäste`}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {booking.guests.map((guest) => (
                  <li
                    key={guest.guestId}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-sm"
                  >
                    {guest.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!isCreator && tableAllowsMultiple && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="participant-activity">Was machst du am Tisch?</Label>
              <Input
                id="participant-activity"
                value={activity}
                maxLength={ACTIVITY_MAX_LENGTH}
                placeholder="z.B. Ölmalerei, Basteln"
                onChange={(event) => setActivity(event.target.value)}
                disabled={pending}
              />
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <div>
            {canEdit && (
              <Button type="button" variant="outline" onClick={onEdit} disabled={pending}>
                <Pencil />
                Bearbeiten
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X />
              Schließen
            </Button>
            {!isCreator && isParticipant && (
              <>
                {tableAllowsMultiple && (
                  <Button
                    type="button"
                    onClick={handleSaveActivity}
                    disabled={pending || !activityChanged}
                  >
                    {pending ? <Spinner /> : <Check />}
                    Speichern
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleLeave}
                  disabled={pending}
                >
                  <LogOut />
                  Verlassen
                </Button>
              </>
            )}
            {!isCreator && !isParticipant && (
              <Button type="button" onClick={handleJoin} disabled={pending}>
                {pending ? <Spinner /> : <LogIn />}
                Mitmachen
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
