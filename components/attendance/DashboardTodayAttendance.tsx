import type { JSX } from "react";
import { listTodayAttendees } from "@/lib/queries/attendance";
import TodayAttendanceButton from "./TodayAttendanceButton";

export default async function DashboardTodayAttendance(): Promise<JSX.Element> {
  const result = await listTodayAttendees();
  const attendees = result.success ? result.attendees : [];

  return <TodayAttendanceButton attendees={attendees} />;
}
