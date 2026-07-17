"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// Calendar + hour/minute selects instead of a native <input type="datetime-local">
// — the native input's AM/PM-vs-24h display is locale-dependent and can't be
// forced from the page, this guarantees German 24h formatting everywhere.
export default function DateTimeField({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");

  function setDate(date: Date | undefined) {
    if (!date) return;
    const next = new Date(date);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(next);
  }

  function setHour(nextHour: string | null) {
    if (nextHour === null) return;
    const next = new Date(value);
    next.setHours(Number(nextHour));
    onChange(next);
  }

  function setMinute(nextMinute: string | null) {
    if (nextMinute === null) return;
    const next = new Date(value);
    next.setMinutes(Number(nextMinute));
    onChange(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        nativeButton={false}
        render={<Button id={id} type="button" variant="outline" className="w-full justify-start font-normal" />}
      >
        <CalendarIcon className="opacity-60" />
        {format(value, "dd.MM.yyyy, HH:mm", { locale: de })} Uhr
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={setDate} locale={de} autoFocus />
        <div className="flex items-center justify-center gap-2 border-t p-3">
          <Select value={hour} onValueChange={setHour}>
            <SelectTrigger className="w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select value={minute} onValueChange={setMinute}>
            <SelectTrigger className="w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {MINUTES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Uhr</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
