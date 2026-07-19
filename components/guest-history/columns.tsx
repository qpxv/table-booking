"use client";

import { useTransition } from "react";
import { ArrowUpDown, Landmark } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatBerlin } from "@/lib/datetime";
import { setBookingGuestPaid, type GuestHistoryRow } from "@/actions/guestHistory";

function mutedClass(paid: boolean) {
  return cn(paid && "text-muted-foreground opacity-60");
}

function PaidCheckbox({ row }: { row: GuestHistoryRow }) {
  const [pending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await setBookingGuestPaid(row.id, checked);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return <Checkbox checked={row.paid} onCheckedChange={handleChange} disabled={pending} />;
}

export function createGuestHistoryColumns({
  onOpenPayment,
  isAdmin,
}: {
  onOpenPayment: (row: GuestHistoryRow) => void;
  isAdmin: boolean;
}): ColumnDef<GuestHistoryRow>[] {
  return [
    {
      accessorKey: "memberId",
      header: "Mitgliedsnummer",
      cell: ({ row }) => (
        <span className={mutedClass(row.original.paid)}>{row.original.memberId ?? "–"}</span>
      ),
    },
    {
      accessorKey: "memberName",
      header: "Name",
      cell: ({ row }) => (
        <span className={mutedClass(row.original.paid)}>{row.original.memberName}</span>
      ),
    },
    {
      accessorKey: "tableName",
      header: "Tisch",
      cell: ({ row }) => (
        <span className={mutedClass(row.original.paid)}>{row.original.tableName}</span>
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
        <span className={mutedClass(row.original.paid)}>{formatBerlin(row.original.start)}</span>
      ),
    },
    {
      accessorKey: "guestName",
      header: "Gast",
      cell: ({ row }) => (
        <span className={mutedClass(row.original.paid)}>{row.original.guestName}</span>
      ),
    },
    {
      accessorKey: "price",
      header: "Preis",
      cell: ({ row }) => (
        <span className={mutedClass(row.original.paid)}>
          {row.original.price === 0 ? "Erster Besuch" : `${row.original.price.toFixed(2)} €`}
        </span>
      ),
    },
    {
      accessorKey: "paid",
      header: "Bezahlt",
      cell: ({ row }) => <PaidCheckbox row={row.original} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aktionen</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={!isAdmin && !row.original.hasIban}
            onClick={() => onOpenPayment(row.original)}
          >
            <Landmark />
            Zahlung
          </Button>
        </div>
      ),
    },
  ];
}
