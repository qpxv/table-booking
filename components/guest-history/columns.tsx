"use client";

import { useTransition } from "react";
import { ArrowUpDown, Landmark } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatBerlin } from "@/lib/datetime";
import { setBookingGuestPaid, type GuestHistoryRow } from "@/actions/guestHistory";

// A free first visit has nothing to collect: treated as settled the same
// as an actually-paid row, both for muted styling and sort order.
export function isSettled(row: GuestHistoryRow): boolean {
  return row.paid || row.price === 0;
}

function mutedClass(settled: boolean) {
  return cn(settled && "text-muted-foreground opacity-60");
}

function PaidCheckbox({
  row,
  onTogglePaid,
}: {
  row: GuestHistoryRow;
  onTogglePaid: (rowId: string, paid: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  // Nothing to collect for a free first visit: always shown as settled,
  // not independently toggleable.
  if (row.price === 0) {
    return <Checkbox checked disabled />;
  }

  function handleChange(checked: boolean) {
    // Optimistic: re-sort immediately instead of waiting for the server
    // round trip, so a just-checked row doesn't sit as a stray in the
    // middle of the unpaid ones until the revalidation lands.
    onTogglePaid(row.id, checked);
    startTransition(async () => {
      const result = await setBookingGuestPaid(row.id, checked);
      if (result.success) {
        toast.success(result.message);
      } else {
        onTogglePaid(row.id, !checked);
        toast.error(result.message);
      }
    });
  }

  return <Checkbox checked={row.paid} onCheckedChange={handleChange} disabled={pending} />;
}

export function createGuestHistoryColumns({
  onOpenPayment,
  onTogglePaid,
  isAdmin,
}: {
  onOpenPayment: (row: GuestHistoryRow) => void;
  onTogglePaid: (rowId: string, paid: boolean) => void;
  isAdmin: boolean;
}): ColumnDef<GuestHistoryRow>[] {
  return [
    {
      accessorKey: "memberId",
      header: "Mitgliedsnummer",
      cell: ({ row }) => (
        <span className={mutedClass(isSettled(row.original))}>{row.original.memberId ?? "–"}</span>
      ),
    },
    {
      accessorKey: "memberName",
      header: "Name",
      cell: ({ row }) => (
        <span className={mutedClass(isSettled(row.original))}>{row.original.memberName}</span>
      ),
    },
    {
      accessorKey: "tableName",
      header: "Tisch",
      cell: ({ row }) => (
        <span className={mutedClass(isSettled(row.original))}>{row.original.tableName}</span>
      ),
    },
    {
      accessorKey: "start",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-2.5"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Datum
          <ArrowUpDown className="ml-1.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className={mutedClass(isSettled(row.original))}>{formatBerlin(row.original.start)}</span>
      ),
    },
    {
      accessorKey: "guestName",
      header: "Gast",
      cell: ({ row }) => (
        <span className={mutedClass(isSettled(row.original))}>{row.original.guestName}</span>
      ),
    },
    {
      accessorKey: "price",
      header: "Preis",
      cell: ({ row }) => (
        <span className={mutedClass(isSettled(row.original))}>
          {row.original.price === 0 ? "Erster Besuch" : `${row.original.price.toFixed(2)} €`}
        </span>
      ),
    },
    {
      accessorKey: "paid",
      header: "Bezahlt",
      cell: ({ row }) => <PaidCheckbox row={row.original} onTogglePaid={onTogglePaid} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aktionen</div>,
      cell: ({ row }) => {
        const canPay = isAdmin || row.original.hasIban;

        if (canPay) {
          return (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => onOpenPayment(row.original)}>
                <Landmark />
                Zahlung
              </Button>
            </div>
          );
        }

        // Deliberately not <Button render={...}> here: TooltipTrigger needs
        // to be the actual interactive element receiving hover/focus events,
        // not composed onto a separate Button via the render prop (a native
        // `disabled` button also never fires hover events at all, in any
        // browser, which is why this is styled-disabled via aria-disabled
        // instead of the real `disabled` attribute).
        return (
          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger
                aria-disabled
                delay={0}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "cursor-not-allowed opacity-50",
                )}
              >
                <Landmark />
                Zahlung
              </TooltipTrigger>
              <TooltipContent>
                Zuerst eine IBAN in den Zahlungsdetails (Einstellungen) hinterlegen.
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}
