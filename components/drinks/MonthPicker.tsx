"use client";

import { useState, type JSX } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTH_LABELS_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

// No month-only shadcn component exists in this repo (`calendar.tsx` is a
// full day-grid react-day-picker wrapper) and pulling in a dependency for a
// 12-button grid isn't warranted, so this is hand-rolled from the same
// Popover/Button primitives used elsewhere.
export default function MonthPicker({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setPickerYear(year);
      }}
    >
      <PopoverTrigger render={<Button variant="outline" />}>
        {formatMonthLabel(year, month)}
        <ChevronsUpDown className="opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="center" className="w-56">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPickerYear((current) => current - 1)}
          >
            <ChevronLeft />
            <span className="sr-only">Vorheriges Jahr</span>
          </Button>
          <span className="text-sm font-medium">{pickerYear}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPickerYear((current) => current + 1)}
          >
            <ChevronRight />
            <span className="sr-only">Nächstes Jahr</span>
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {MONTH_LABELS_SHORT.map((label, index) => {
            const monthValue = index + 1;
            const isSelected = pickerYear === year && monthValue === month;
            return (
              <Button
                key={label}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className={cn(!isSelected && "font-normal")}
                onClick={() => {
                  onChange(pickerYear, monthValue);
                  setOpen(false);
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
