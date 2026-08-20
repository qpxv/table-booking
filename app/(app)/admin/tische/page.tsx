import type { JSX } from "react";
import { listTables } from "@/lib/queries/tables";
import TableManager from "@/components/tables/TableManager";

export default async function AdminTablesPage(): Promise<JSX.Element> {
  const result = await listTables();
  if (!result.success) throw new Error(result.message);
  const tables = result.tables;

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
