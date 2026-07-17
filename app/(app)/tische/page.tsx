import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { listTablesWithUpcomingWeekCounts } from "@/actions/tables";

export default async function TablesListPage() {
  const activeTables = await listTablesWithUpcomingWeekCounts();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Tische</h1>

      {activeTables.length === 0 && (
        <p className="text-sm text-muted-foreground">Aktuell sind keine Tische verfügbar.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {activeTables.map((table) => (
          <Link key={table.id} href={`/tische/${table.id}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-2">
                <CardTitle>{table.name}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {table.upcomingWeekBookingCount}{" "}
                  {table.upcomingWeekBookingCount === 1 ? "Buchung" : "Buchungen"} diese Woche
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
