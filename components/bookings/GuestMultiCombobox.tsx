"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { GuestWithVisits } from "@/actions/guests";

export type GuestSelection =
  | { type: "existing"; guest: GuestWithVisits }
  | { type: "new"; name: string };

// Deliberately not built on Popover/PopoverTrigger — see GameCombobox for
// why. Plain absolutely-positioned dropdown, dismissed via a manual
// pointerdown-outside check instead.
export default function GuestMultiCombobox({
  value,
  onChange,
  knownGuests,
}: {
  value: GuestSelection[];
  onChange: (value: GuestSelection[]) => void;
  knownGuests: GuestWithVisits[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(
    value
      .filter((selection): selection is Extract<GuestSelection, { type: "existing" }> =>
        selection.type === "existing",
      )
      .map((selection) => selection.guest.id),
  );

  const trimmedSearch = search.trim();
  const matches = knownGuests.filter(
    (guest) =>
      !selectedIds.has(guest.id) &&
      guest.name.toLowerCase().includes(trimmedSearch.toLowerCase()),
  );
  const exactMatch = knownGuests.some(
    (guest) => guest.name.toLowerCase() === trimmedSearch.toLowerCase(),
  );

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function addGuest(selection: GuestSelection) {
    onChange([...value, selection]);
    setSearch("");
  }

  function removeGuest(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((selection, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {selection.type === "existing" ? selection.guest.name : selection.name}
              <button
                type="button"
                onClick={() => removeGuest(index)}
                className="ml-0.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div ref={containerRef} className="relative">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Bekannten Gast wählen oder neuen Namen eingeben"
          autoComplete="off"
        />
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <Command>
              <CommandList>
                {matches.length === 0 && trimmedSearch === "" && (
                  <CommandEmpty>Keine Gäste gefunden.</CommandEmpty>
                )}
                <CommandGroup>
                  {matches.map((guest) => (
                    <CommandItem
                      key={guest.id}
                      onSelect={() => addGuest({ type: "existing", guest })}
                    >
                      {guest.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({guest.hasVisitedBefore ? "schon da gewesen" : "erstes Mal"})
                      </span>
                    </CommandItem>
                  ))}
                  {trimmedSearch !== "" && !exactMatch && (
                    <CommandItem onSelect={() => addGuest({ type: "new", name: trimmedSearch })}>
                      „{trimmedSearch}“ als neuen Gast hinzufügen
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
}
