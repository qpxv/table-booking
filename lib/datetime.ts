import { addDays, endOfWeek, startOfDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { SEARCH_PARAMS } from "@/lib/constants";

export const APP_TIMEZONE = "Europe/Berlin";

export function formatBerlin(date: Date, pattern = "dd.MM.yyyy HH:mm"): string {
  return formatInTimeZone(date, APP_TIMEZONE, pattern);
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
