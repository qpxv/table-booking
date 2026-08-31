"use client";

import dynamic from "next/dynamic";
import { CalendarResponsiveSkeleton } from "./TableCalendarSkeleton";

// The booking calendar never renders on the server. Loading it lazily lets
// the page shell and the table-name heading paint immediately, with a
// skeleton standing in until the chunk arrives.
const BookingCalendarLazy = dynamic(() => import("./BookingCalendar"), {
  ssr: false,
  loading: () => <CalendarResponsiveSkeleton />,
});

export default BookingCalendarLazy;
