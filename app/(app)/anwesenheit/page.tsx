import { Suspense, type JSX } from "react";
import AttendanceContent from "@/components/attendance/AttendanceContent";
import AttendanceCalendarSkeleton from "@/components/attendance/AttendanceCalendarSkeleton";

export default function AttendancePage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Anwesenheit</h1>
        <p className="text-sm text-muted-foreground">
          Tippe auf einen Tag, um dich als anwesend zu markieren. Wer an dem Tag eine Buchung
          hat, zählt automatisch als anwesend.
        </p>
      </div>

      <Suspense fallback={<AttendanceCalendarSkeleton />}>
        <AttendanceContent />
      </Suspense>
    </div>
  );
}
