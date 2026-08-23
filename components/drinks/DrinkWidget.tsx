"use client";

import { useState, useTransition, type JSX } from "react";
import { Beer, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { adjustDrinkCount } from "@/service/drink-service/drink";
import { showToast } from "@/lib/toast";
import type { DrinkWidgetGuest } from "@/lib/drink-types";

// Guest presses roll into the same underlying member count (there's no
// per-guest ledger), so the popover shows the total once up top with a
// single undo control, and a "+" per person to attribute who it's for.
function useDrinkCounter(initialCount: number): {
  count: number;
  pending: boolean;
  adjust: (delta: 1 | -1) => void;
} {
  const [prevCount, setPrevCount] = useState(initialCount);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  if (initialCount !== prevCount) {
    setPrevCount(initialCount);
    setCount(initialCount);
  }

  function adjust(delta: 1 | -1): void {
    setCount((current) => Math.max(0, current + delta));
    startTransition(async () => {
      const result = await adjustDrinkCount(delta);
      showToast(result);
      if (!result.success) setCount((current) => Math.max(0, current - delta));
    });
  }

  return { count, pending, adjust };
}

function DrinkAddRow({
  label,
  onAdd,
  pending,
}: {
  label: string;
  onAdd: () => void;
  pending: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-sm text-muted-foreground">{label}</span>
      <Button variant="outline" size="icon-sm" disabled={pending} onClick={onAdd}>
        <Plus />
        <span className="sr-only">Getränk für {label} hinzufügen</span>
      </Button>
    </div>
  );
}

function DrinkPopoverContent({
  count,
  guests,
  onAdjust,
  pending,
}: {
  count: number;
  guests: DrinkWidgetGuest[];
  onAdjust: (delta: 1 | -1) => void;
  pending: boolean;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Getränke diesen Monat</span>
        <div className="flex items-center gap-1.5">
          <span className="w-5 text-center text-base font-semibold tabular-nums">{count}</span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={pending || count === 0}
            onClick={() => onAdjust(-1)}
          >
            <Minus />
            <span className="sr-only">Getränk entfernen</span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <DrinkAddRow label="Du" onAdd={() => onAdjust(1)} pending={pending} />
        {guests.map((guest) => (
          <DrinkAddRow key={guest.id} label={guest.name} onAdd={() => onAdjust(1)} pending={pending} />
        ))}
      </div>
    </div>
  );
}

export function DrinkWidgetHeaderButton({
  ownCount,
  guests,
}: {
  ownCount: number;
  guests: DrinkWidgetGuest[];
}): JSX.Element {
  const { count, pending, adjust } = useDrinkCounter(ownCount);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
          />
        }
      >
        <Beer />
        <span className="sr-only">Getränke</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end">
        <DrinkPopoverContent count={count} guests={guests} onAdjust={adjust} pending={pending} />
      </PopoverContent>
    </Popover>
  );
}

export function DrinkWidgetSidebarItem({
  ownCount,
  guests,
}: {
  ownCount: number;
  guests: DrinkWidgetGuest[];
}): JSX.Element {
  const { count, pending, adjust } = useDrinkCounter(ownCount);

  return (
    <SidebarMenuItem>
      <Popover>
        <PopoverTrigger render={<SidebarMenuButton />}>
          <Beer />
          Getränke
          {count > 0 && <span className="ml-auto text-xs text-muted-foreground">{count}</span>}
        </PopoverTrigger>
        <PopoverContent side="right" align="start">
          <DrinkPopoverContent count={count} guests={guests} onAdjust={adjust} pending={pending} />
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
