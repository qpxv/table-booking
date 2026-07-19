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
