import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { listAttendanceDays } from "@/lib/queries/attendance";
import { berlinDayString, getTodayBerlinRange } from "@/lib/datetime";
import AttendanceView from "./AttendanceView";

export default async function AttendanceContent(): Promise<JSX.Element> {
  await checkSession();

  const result = await listAttendanceDays();
  if (!result.success) throw new Error(result.message);

  return (
    <AttendanceView
      days={result.days}
      todayString={berlinDayString(getTodayBerlinRange().start)}
    />
  );
}
