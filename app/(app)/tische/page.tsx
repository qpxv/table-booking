import Link from "next/link";
import { Dices, ChevronRight } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { listTablesWithUpcomingWeekCounts } from "@/actions/tables";
import { formatBerlin } from "@/lib/datetime";

export default async function TablesListPage() {
  const activeTables = await listTablesWithUpcomingWeekCounts();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reservieren</h1>
        <p className="text-sm text-muted-foreground">
          Wähle einen Tisch, um ihn zu reservieren.
        </p>
      </div>

      {activeTables.length === 0 && (
        <p className="text-sm text-muted-foreground">Aktuell sind keine Tische verfügbar.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {activeTables.map((table) => {
          const hasBookings = table.upcomingWeekBookingCount > 0;
          const { nextEvent } = table;
          return (
            <Link key={table.id} href={`/tische/${table.id}`} className="block">
              <Card className="ring-foreground/10 transition-all hover:shadow-md hover:ring-secondary/30">
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Dices className="size-5" />
                    </div>
                    <CardTitle className="grow text-lg">{table.name}</CardTitle>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover/card:translate-x-0.5 group-hover/card:opacity-100" />
                  </div>

                  {table.allowMultipleBookings ? (
                    <div>
                      <p
                        className={
                          nextEvent
                            ? "font-heading text-3xl font-semibold text-secondary"
                            : "font-heading text-3xl font-semibold text-muted-foreground"
                        }
                      >
                        {nextEvent ? nextEvent.participantCount : "–"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {nextEvent
                          ? nextEvent.participantCount === 1
                            ? "Angemeldet"
                            : "Angemeldete"
                          : "Kein Termin geplant"}
                      </p>
                      {nextEvent && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatBerlin(nextEvent.start)}
                          {nextEvent.game && ` · ${nextEvent.game}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p
                        className={
                          hasBookings
                            ? "font-heading text-3xl font-semibold text-secondary"
                            : "font-heading text-3xl font-semibold text-muted-foreground"
                        }
                      >
                        {table.upcomingWeekBookingCount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hasBookings
                          ? table.upcomingWeekBookingCount === 1
                            ? "Buchung diese Woche"
                            : "Buchungen diese Woche"
                          : "Keine Buchungen diese Woche"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
