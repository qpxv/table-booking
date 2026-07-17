import { formatInTimeZone } from "date-fns-tz";

export const APP_TIMEZONE = "Europe/Berlin";

export function formatBerlin(date: Date, pattern = "dd.MM.yyyy HH:mm"): string {
  return formatInTimeZone(date, APP_TIMEZONE, pattern);
}
