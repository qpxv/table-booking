import type { Table } from "@/generated/prisma/client";

export type TableWithUpcomingWeekCount = Table & {
  upcomingWeekBookingCount: number;
  nextEvent: { start: Date; end: Date; participantCount: number } | null;
};
