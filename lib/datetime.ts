import { formatInTimeZone } from "date-fns-tz";

// All times are stored in the DB in UTC and displayed in Europe/Berlin on the frontend.
export const APP_TIMEZONE = "Europe/Berlin";

export function formatBerlin(date: Date, pattern = "dd.MM.yyyy HH:mm"): string {
  return formatInTimeZone(date, APP_TIMEZONE, pattern);
}
