import type { JSX } from "react";
import { listTables } from "@/lib/queries/tables";
import TableManager from "@/components/tables/TableManager";

export default async function TableManagerContent(): Promise<JSX.Element> {
  const result = await listTables();
  if (!result.success) throw new Error(result.message);

  return <TableManager tables={result.tables} />;
}
