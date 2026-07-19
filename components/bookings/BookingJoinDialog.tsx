"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { LogIn, LogOut, Pencil, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatBerlin } from "@/lib/datetime";
import { joinBooking, leaveBooking } from "@/actions/bookings";
import type { CalendarBooking } from "./BookingCalendar";

// Shown when clicking an event on a "Mehrfachbuchung" (shared) table instead
// of the normal edit dialog — any member can join/leave; only the creator or
// an admin can jump to the full edit dialog to reschedule/cancel.
export default function BookingJoinDialog({
  tableName,
  booking,
  currentUserId,
  canEdit,
  onEdit,
  onClose,
}: {
  tableName: string;
  booking: CalendarBooking;
  currentUserId: string;
  canEdit: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isParticipant = booking.participants.some((p) => p.userId === currentUserId);

  function handleJoinToggle() {
    startTransition(async () => {
      const result = isParticipant
        ? await leaveBooking(booking.id)
        : await joinBooking(booking.id);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
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
          <div>
            <p className="mb-1.5 text-sm font-medium">
              {booking.participants.length === 1
                ? "1 Angemeldet"
                : `${booking.participants.length} Angemeldete`}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {booking.participants.map((participant) => (
                <li
                  key={participant.userId}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-sm"
                >
                  {participant.name}
                </li>
              ))}
            </ul>
          </div>
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
            <Button
              type="button"
              variant={isParticipant ? "destructive" : "default"}
              onClick={handleJoinToggle}
              disabled={pending}
            >
              {pending ? <Spinner /> : isParticipant ? <LogOut /> : <LogIn />}
              {isParticipant ? "Verlassen" : "Mitmachen"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
