import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@/lib/datetime";
import { DEFAULT_BOOKING_DURATION_HOURS } from "@/lib/constants";

export type ParsedWindow =
  | { ok: true; start: Date; end: Date }
  | { ok: false };

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function parseDate(input: string, now: Date): DateParts | null {
  const value = input.trim();

  // ISO: 2026-09-05
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  }

  // German: 5.9. / 05.09.2026 / 5.9.26
  const de = /^(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?\.?$/.exec(value);
  if (de) {
    const day = Number(de[1]);
    const month = Number(de[2]);
    let year: number;
    if (de[3]) {
      year = Number(de[3]);
      if (year < 100) year += 2000;
    } else {
      // No year given: this year, or next year if the day already passed.
      const berlinNow = toZonedTime(now, APP_TIMEZONE);
      year = berlinNow.getFullYear();
      const candidate = new Date(year, month - 1, day, 23, 59);
      const berlinToday = new Date(
        berlinNow.getFullYear(),
        berlinNow.getMonth(),
        berlinNow.getDate(),
      );
      if (candidate < berlinToday) year += 1;
    }
    return { year, month, day };
  }

  return null;
}

function parseTime(input: string): { hours: number; minutes: number } | null {
  const value = input.trim().replace(",", ":").replace(".", ":").replace(/\s*uhr$/i, "");
  const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(value);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

/** `4h` / `4` / `2:30` / `1,5h` / `90m` -> minutes. */
function parseDurationMinutes(input: string | null): number | null {
  if (!input) return DEFAULT_BOOKING_DURATION_HOURS * 60;
  const value = input.trim().toLowerCase().replace(",", ".");

  const hm = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);

  const min = /^(\d{1,3})\s*(m|min)$/.exec(value);
  if (min) return Number(min[1]);

  const hours = /^(\d{1,2}(?:\.\d)?)\s*(h|std|stunden?)?$/.exec(value);
  if (hours) return Math.round(Number(hours[1]) * 60);

  return null;
}

function isValidDate(parts: DateParts): boolean {
  const d = new Date(parts.year, parts.month - 1, parts.day);
  return (
    d.getFullYear() === parts.year &&
    d.getMonth() === parts.month - 1 &&
    d.getDate() === parts.day
  );
}

/**
 * Parse a `/buchen`-style German date + time (+ optional duration) into a
 * concrete UTC [start, end) window. Berlin-local input.
 */
export function parseGermanDateTime(
  datum: string,
  uhrzeit: string,
  dauer: string | null,
  now: Date = new Date(),
): ParsedWindow {
  const dateParts = parseDate(datum, now);
  const time = parseTime(uhrzeit);
  const durationMinutes = parseDurationMinutes(dauer);

  if (!dateParts || !isValidDate(dateParts) || !time || !durationMinutes || durationMinutes <= 0) {
    return { ok: false };
  }

  const pad = (n: number): string => String(n).padStart(2, "0");
  const localString = `${dateParts.year}-${pad(dateParts.month)}-${pad(dateParts.day)}T${pad(time.hours)}:${pad(time.minutes)}:00`;
  const start = fromZonedTime(localString, APP_TIMEZONE);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  return { ok: true, start, end };
}

/**
 * Parse a single "05.09. 18:00" / "2026-09-05 18:00" string (date and time
 * separated by whitespace) plus an optional duration.
 */
export function parseCombinedDateTime(
  value: string,
  dauer: string | null,
  now: Date = new Date(),
): ParsedWindow {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 2) return { ok: false };
  const time = parts.pop() as string;
  const date = parts.join(" ");
  return parseGermanDateTime(date, time, dauer, now);
}
