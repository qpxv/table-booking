import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { listTables } from "@/actions/tables";

export default async function TablesListPage() {
  const allTables = await listTables();
  const activeTables = allTables.filter((table) => table.active);

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
              <CardContent>
                <CardTitle>{table.name}</CardTitle>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
