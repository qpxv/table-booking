"use client";

import { useOptimistic, useTransition, type JSX } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { toggleAttendance } from "@/service/attendance-service/attendance";
import type { AttendanceDay } from "@/lib/queries/attendance";
import AttendanceCalendar from "./AttendanceCalendarLazy";

function applyToggle(state: AttendanceDay[], day: string): AttendanceDay[] {
  const existing = state.find((d) => d.date === day);
  if (!existing) {
    return [...state, { date: day, count: 1, mePresent: true }];
  }
  const count = existing.mePresent ? existing.count - 1 : existing.count + 1;
  if (count <= 0) return state.filter((d) => d.date !== day);
  return state.map((d) =>
    d.date === day ? { ...d, mePresent: !d.mePresent, count } : d,
  );
}

export default function AttendanceView({
  days,
  todayString,
}: {
  days: AttendanceDay[];
  todayString: string;
}): JSX.Element {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticDays, addOptimisticToggle] = useOptimistic(days, applyToggle);

  function handleToggle(day: string): void {
    startTransition(async () => {
      addOptimisticToggle(day);
      const result = await toggleAttendance(day);
      showToast(result);
      if (!result.success) router.refresh();
    });
  }

  return (
    <AttendanceCalendar
      days={optimisticDays}
      todayString={todayString}
      onToggle={handleToggle}
    />
  );
}
