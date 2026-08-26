"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import type { Game } from "@/generated/prisma/client";

// Free-text input with pick-from-list suggestions: not a fixed choice, the
// typed value itself is what gets saved (matches the previous freeSolo Autocomplete).
// Suggestions come from Spielverwaltung's admin-managed `games` list, not a
// hardcoded array, so typing a one-off value not in that list is still fine.
//
// Deliberately not built on Popover/PopoverTrigger: that primitive ties
// "is this the trigger" to "is this exempt from outside-press dismissal",
// which fights an input that needs to open on focus/typing rather than a
// single click. This is a plain absolutely-positioned dropdown instead,
// dismissed via a manual pointerdown-outside check.
export default function GameCombobox({
  value,
  onChange,
  games,
}: {
  value: string;
  onChange: (value: string) => void;
  games: Pick<Game, "id" | "name">[];
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestions = games.filter((game) =>
    game.name.toLowerCase().includes(value.trim().toLowerCase()),
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

  const showSuggestions = open && suggestions.length > 0;

  // Not a cmdk CommandInput, so Enter has no built-in "select the
  // highlighted match" behavior: left alone, it falls through to the
  // outer BookingDialog form's default submit instead. Always suppress
  // that; if a suggestion is showing, pick the top one to mirror clicking
  // the first CommandItem (the typed value is already live-bound via
  // onChange, so there's nothing else to do otherwise).
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (showSuggestions) {
      onChange(suggestions[0].name);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Spiel"
        autoComplete="off"
      />
      {showSuggestions && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <Command>
            <CommandList>
              <CommandGroup>
                {suggestions.map((game) => (
                  <CommandItem
                    key={game.id}
                    onSelect={() => {
                      onChange(game.name);
                      setOpen(false);
                    }}
                  >
                    {game.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
