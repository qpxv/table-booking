import { endOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

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
