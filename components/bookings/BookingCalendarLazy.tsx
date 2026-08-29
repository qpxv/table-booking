"use client";

import dynamic from "next/dynamic";
import { CalendarWeekGridSkeleton } from "./TableCalendarSkeleton";

// FullCalendar + its plugins are ~200 KB of JS that only this route needs and
// that never render on the server anyway. Loading it lazily lets the page
// shell and the table-name heading paint immediately, with the week-grid
// skeleton standing in until the chunk arrives.
const BookingCalendarLazy = dynamic(() => import("./BookingCalendar"), {
  ssr: false,
  loading: () => <CalendarWeekGridSkeleton />,
});

export default BookingCalendarLazy;
