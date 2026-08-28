import { Suspense, type JSX } from "react";
import TableManagerContent from "@/components/tables/TableManagerContent";
import ManagerTableSkeleton from "@/components/shared/ManagerTableSkeleton";

export default function AdminTablesPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tischverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Tische anlegen, bearbeiten und aktivieren.
        </p>
      </div>
      <Suspense fallback={<ManagerTableSkeleton columns={5} />}>
        <TableManagerContent />
      </Suspense>
    </div>
  );
}
