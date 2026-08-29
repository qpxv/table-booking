"use client";

import dynamic from "next/dynamic";
import AttendanceCalendarSkeleton from "./AttendanceCalendarSkeleton";

const AttendanceCalendarLazy = dynamic(() => import("./AttendanceCalendar"), {
  ssr: false,
  loading: () => <AttendanceCalendarSkeleton />,
});

export default AttendanceCalendarLazy;
