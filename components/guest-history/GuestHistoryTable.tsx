"use client";

import { useCallback, useMemo, useState } from "react";
import { Users, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { GuestHistoryRow } from "@/actions/guestHistory";
import { createGuestHistoryColumns, isSettled } from "./columns";
import PaymentDialog from "./PaymentDialog";

// Unsettled first (unpaid, and not a free first visit), newest booking
// first within each group; re-applied client-side so toggling "Bezahlt"
// re-sorts the table immediately instead of waiting for the server round
// trip to land.
function sortRows(rows: GuestHistoryRow[]): GuestHistoryRow[] {
  return [...rows].sort((a, b) => {
    const aSettled = isSettled(a);
    const bSettled = isSettled(b);
    if (aSettled !== bSettled) return aSettled ? 1 : -1;
    return b.start.getTime() - a.start.getTime();
  });
}

export default function GuestHistoryTable({
  rows,
  isAdmin,
  currentUserId,
}: {
  rows: GuestHistoryRow[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [prevRows, setPrevRows] = useState(rows);
  const [localRows, setLocalRows] = useState(rows);
  const [onlyMine, setOnlyMine] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<GuestHistoryRow | null>(null);

  // Re-sync local state when a real refetch (revalidatePath) brings fresh
  // server data: React's own recommended way to adjust state from a prop
  // change (bails out before committing, no extra render/flicker), rather
  // than a useEffect + setState round trip.
  if (rows !== prevRows) {
    setPrevRows(rows);
    setLocalRows(rows);
  }

  const handleTogglePaid = useCallback((rowId: string, paid: boolean) => {
    setLocalRows((current) => current.map((row) => (row.id === rowId ? { ...row, paid } : row)));
  }, []);

  const sortedRows = useMemo(() => sortRows(localRows), [localRows]);

  const visibleRows = useMemo(
    () => (onlyMine ? sortedRows.filter((row) => row.memberUserId === currentUserId) : sortedRows),
    [sortedRows, onlyMine, currentUserId],
  );

  const columns = useMemo(
    () =>
      createGuestHistoryColumns({
        onOpenPayment: setPaymentTarget,
        onTogglePaid: handleTogglePaid,
        isAdmin,
      }),
    [isAdmin, handleTogglePaid],
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
