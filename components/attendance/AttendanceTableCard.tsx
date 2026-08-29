import type { JSX } from "react";
import Link from "next/link";
import { CalendarCheck, ChevronRight } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getNextAttendanceDay } from "@/lib/queries/attendance";
import { formatBerlin } from "@/lib/datetime";
import { ROUTES } from "@/lib/constants";

// Permanent fixture on the Reservieren grid, independent of the tables in
// Tischverwaltung. Shows the soonest upcoming day on which anyone is
// anwesend and the headcount; days with nobody are never shown.
export default async function AttendanceTableCard(): Promise<JSX.Element> {
  const result = await getNextAttendanceDay();
  const next = result.success ? result.next : null;

  return (
    <Link href={ROUTES.ANWESENHEIT} className="block">
      <Card className="ring-foreground/10 transition-all hover:shadow-md hover:ring-secondary/30">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CalendarCheck className="size-5" />
            </div>
            <CardTitle className="grow text-lg">Anwesenheit</CardTitle>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover/card:translate-x-0.5 group-hover/card:opacity-100" />
          </div>

          <div>
            <p
              className={
                next
                  ? "font-heading text-3xl font-semibold text-secondary"
                  : "font-heading text-3xl font-semibold text-muted-foreground"
              }
            >
              {next ? next.count : "–"}
            </p>
            <p className="text-sm text-muted-foreground">
              {next
                ? next.count === 1
                  ? "Anwesend"
                  : "Anwesende"
                : "Noch keine Anwesenheit geplant"}
            </p>
            {next && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatBerlin(next.date, "dd.MM.yyyy")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
