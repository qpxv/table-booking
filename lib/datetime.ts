import { addDays, endOfWeek, startOfDay, startOfMonth } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { SEARCH_PARAMS } from "@/lib/constants";

export const APP_TIMEZONE = "Europe/Berlin";

export function formatBerlin(date: Date, pattern = "dd.MM.yyyy HH:mm"): string {
  return formatInTimeZone(date, APP_TIMEZONE, pattern);
}

/**
 * Human-readable date/time label for a club event. When the event has an
 * end that falls on a different Berlin calendar day than the start, both
 * ends show their full date so a multi-day event reads correctly.
 */
export function formatEventDateRange(start: Date, end: Date | null): string {
  if (!end) {
    return `${formatBerlin(start)} Uhr`;
  }

  const sameDay =
    formatInTimeZone(start, APP_TIMEZONE, "yyyy-MM-dd") ===
    formatInTimeZone(end, APP_TIMEZONE, "yyyy-MM-dd");

  const endLabel = sameDay ? formatBerlin(end, "HH:mm") : formatBerlin(end);
  return `${formatBerlin(start)} – ${endLabel} Uhr`;
}

/** End of the current week (Sunday 23:59:59.999, Monday-start) in Berlin time, as a UTC Date. */
export function endOfWeekBerlin(date: Date = new Date()): Date {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  const zonedWeekEnd = endOfWeek(zoned, { weekStartsOn: 1 });
  return fromZonedTime(zonedWeekEnd, APP_TIMEZONE);
}

/** Current calendar year/month (1-12) in Berlin time. */
export function getCurrentBerlinYearMonth(date: Date = new Date()): { year: number; month: number } {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  return { year: zoned.getFullYear(), month: zoned.getMonth() + 1 };
}

/** UTC bounds of "today" (Berlin calendar date) as a [start, end) range. */
export function getTodayBerlinRange(date: Date = new Date()): { start: Date; end: Date } {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  const zonedStart = startOfDay(zoned);
  return {
    start: fromZonedTime(zonedStart, APP_TIMEZONE),
    end: fromZonedTime(addDays(zonedStart, 1), APP_TIMEZONE),
  };
}

/** The Berlin calendar day of `date` as a plain `yyyy-MM-dd` string. */
export function berlinDayString(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

/**
 * A `yyyy-MM-dd` Berlin day as the UTC-midnight `Date` used for `@db.Date`
 * columns (see the Attendance model). Berlin is always UTC+1/+2, so this
 * value formats back to the same day in `berlinDayString`.
 */
export function attendanceDayToDate(dayString: string): Date {
  return new Date(`${dayString}T00:00:00.000Z`);
}

/** UTC [start, end) bounds of a `yyyy-MM-dd` Berlin calendar day. */
export function berlinDayRange(dayString: string): { start: Date; end: Date } {
  const start = fromZonedTime(`${dayString}T00:00:00`, APP_TIMEZONE);
  return { start, end: addDays(start, 1) };
}

/** Start of the current Berlin month (00:00 on the 1st) as a UTC Date. */
export function startOfMonthBerlin(date: Date = new Date()): Date {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  return fromZonedTime(startOfMonth(zoned), APP_TIMEZONE);
}

/** Whole days elapsed since `dateString`, for simple "X Tage" style counters. */
export function daysSince(dateString: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(dateString).getTime()) / 86_400_000);
}

/**
 * Parses `?year=&month=` search params into a valid (year, month), falling
 * back to the current Berlin month when absent/invalid.
 */
export function parseYearMonthSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): { year: number; month: number } {
  const current = getCurrentBerlinYearMonth();
  const year = Number(searchParams[SEARCH_PARAMS.YEAR]);
  const month = Number(searchParams[SEARCH_PARAMS.MONTH]);

  return {
    year: Number.isInteger(year) ? year : current.year,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : current.month,
  };
}
