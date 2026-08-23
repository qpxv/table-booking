"use client";

import { ArrowUpDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { DrinkReportRow } from "@/lib/drink-types";

export const drinkReportColumns: ColumnDef<DrinkReportRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Mitglied
        <ArrowUpDown className="ml-1.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.name}</span>
        {row.original.memberId && (
          <span className="text-xs text-muted-foreground">{row.original.memberId}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "count",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Getränke
        <ArrowUpDown className="ml-1.5" />
      </Button>
    ),
    cell: ({ row }) => <span className="tabular-nums">{row.original.count}</span>,
  },
];
