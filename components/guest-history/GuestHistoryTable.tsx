"use client";

import { useMemo, useState } from "react";
import { Users, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { GuestHistoryRow } from "@/actions/guestHistory";
import { createGuestHistoryColumns } from "./columns";
import PaymentDialog from "./PaymentDialog";

export default function GuestHistoryTable({
  rows,
  isAdmin,
  currentUserId,
}: {
  rows: GuestHistoryRow[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [onlyMine, setOnlyMine] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<GuestHistoryRow | null>(null);

  const visibleRows = useMemo(
    () => (onlyMine ? rows.filter((row) => row.memberUserId === currentUserId) : rows),
    [rows, onlyMine, currentUserId],
  );

  const columns = useMemo(
    () => createGuestHistoryColumns({ onOpenPayment: setPaymentTarget, isAdmin }),
    [isAdmin],
  );

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setOnlyMine((value) => !value)}>
            {onlyMine ? <Users /> : <UserRound />}
            {onlyMine ? "Alle Mitglieder anzeigen" : "Nur meine eigenen Gäste anzeigen"}
          </Button>
        </div>
      )}
      <DataTable columns={columns} data={visibleRows} />
      {paymentTarget && <PaymentDialog row={paymentTarget} onClose={() => setPaymentTarget(null)} />}
    </div>
  );
}
