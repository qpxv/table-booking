import { Suspense, type JSX } from "react";
import TablesGrid from "@/components/tables/TablesGrid";
import TablesGridSkeleton from "@/components/tables/TablesGridSkeleton";

export default function TablesListPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reservieren</h1>
        <p className="text-sm text-muted-foreground">
          Wähle einen Tisch, um ihn zu reservieren.
        </p>
      </div>

      <Suspense fallback={<TablesGridSkeleton />}>
        <TablesGrid />
      </Suspense>
    </div>
  );
}
