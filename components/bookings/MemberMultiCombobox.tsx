"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type MemberOption = { id: string; name: string };

// Same non-Popover/PopoverTrigger dropdown pattern as GuestMultiCombobox —
// see that component for why. Unlike guests, members aren't created ad hoc
// here: this only picks from the fixed club roster, no "add new" branch.
export default function MemberMultiCombobox({
  value,
  onChange,
  knownMembers,
}: {
  value: MemberOption[];
  onChange: (value: MemberOption[]) => void;
  knownMembers: MemberOption[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(value.map((member) => member.id));
  const trimmedSearch = search.trim();
  const matches = knownMembers.filter(
    (member) =>
      !selectedIds.has(member.id) && member.name.toLowerCase().includes(trimmedSearch.toLowerCase()),
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

  function addMember(member: MemberOption) {
    onChange([...value, member]);
    setSearch("");
  }

  function removeMember(id: string) {
    onChange(value.filter((member) => member.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((member) => (
            <Badge key={member.id} variant="secondary" className="gap-1">
              {member.name}
              <button
                type="button"
                onClick={() => removeMember(member.id)}
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
          placeholder="Mitglied hinzufügen"
          autoComplete="off"
        />
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <Command>
              <CommandList>
                {matches.length === 0 && <CommandEmpty>Keine Mitglieder gefunden.</CommandEmpty>}
                <CommandGroup>
                  {matches.map((member) => (
                    <CommandItem key={member.id} onSelect={() => addMember(member)}>
                      {member.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
}
