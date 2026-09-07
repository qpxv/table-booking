"use client";

import type { JSX } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TodayAttendee } from "@/lib/queries/attendance";

export default function TodayAttendanceButton({
  attendees,
}: {
  attendees: TodayAttendee[];
}): JSX.Element {
  const count = attendees.length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            disabled={count === 0}
            className="shrink-0 font-medium tabular-nums"
            aria-label={`${count} Mitglieder heute anwesend`}
          />
        }
      >
        {count}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <PopoverHeader>
          <PopoverTitle className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            Heute anwesend
          </PopoverTitle>
        </PopoverHeader>
        <ul className="flex flex-col gap-1">
          {attendees.map((attendee) => (
            <li key={attendee.id} className="text-sm">
              {attendee.name}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
