import { listTables } from "@/actions/tables";
import TableManager from "@/components/tables/TableManager";

export default async function AdminTablesPage() {
  const tables = await listTables();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tischverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Tische anlegen, bearbeiten und aktivieren.
        </p>
      </div>
      <TableManager tables={tables} />
    </div>
  );
}
