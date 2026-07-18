"use client";

import { useRef, useState } from "react";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";

const COMMON_GAMES = ["Skat", "Doppelkopf", "Schafkopf", "Poker", "Billard", "Darts", "Sonstiges"];

// Free-text input with pick-from-list suggestions — not a fixed choice, the
// typed value itself is what gets saved (matches the previous freeSolo Autocomplete).
export default function GameCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = COMMON_GAMES.filter((game) =>
    game.toLowerCase().includes(value.trim().toLowerCase()),
  );

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Spiel"
        autoComplete="off"
      />
      <PopoverContent
        anchor={inputRef}
        align="start"
        className="w-(--anchor-width) p-1"
        finalFocus={false}
      >
        <Command>
          <CommandList>
            <CommandGroup>
              {suggestions.map((game) => (
                <CommandItem
                  key={game}
                  onSelect={() => {
                    onChange(game);
                    setOpen(false);
                  }}
                >
                  {game}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
