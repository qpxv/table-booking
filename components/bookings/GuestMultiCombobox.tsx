"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GuestWithVisits } from "@/lib/guest-types";
import { isExistingGuestSelection, type GuestSelection } from "@/lib/booking-types";

// Deliberately not built on Popover/PopoverTrigger: see GameCombobox for
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
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(
    value.filter(isExistingGuestSelection).map((selection) => selection.guest.id),
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
    function handlePointerDown(event: PointerEvent): void {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function addGuest(selection: GuestSelection): void {
    onChange([...value, selection]);
    setSearch("");
  }

  function removeGuest(index: number): void {
    onChange(value.filter((_, i) => i !== index));
  }

  // The Input isn't a cmdk CommandInput, so Enter has no built-in
  // "select the highlighted match" behavior: left alone, it falls through
  // to the outer BookingDialog form's default submit instead. Always
  // suppress that, and add the top-of-list match (or the typed name as a
  // new guest) to mirror clicking the first CommandItem.
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (matches.length > 0) {
      addGuest({ type: "existing", guest: matches[0] });
    } else if (trimmedSearch !== "" && !exactMatch) {
      addGuest({ type: "new", name: trimmedSearch });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((selection, index) => {
            const guestName = isExistingGuestSelection(selection) ? selection.guest.name : selection.name;
            return (
              <Badge key={index} variant="secondary" className="gap-1">
                {guestName}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-0.5 rounded-full [&_svg]:size-3"
                  onClick={() => removeGuest(index)}
                >
                  <X />
                  <span className="sr-only">{guestName} entfernen</span>
                </Button>
              </Badge>
            );
          })}
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
          onKeyDown={handleKeyDown}
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
