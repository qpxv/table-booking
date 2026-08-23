import type { JSX } from "react";
import { getDrinkReport } from "@/lib/queries/drinks";
import { parseYearMonthSearchParams } from "@/lib/datetime";
import DrinkReportView from "@/components/drinks/DrinkReportView";

export default async function AdminDrinksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<JSX.Element> {
  const { year, month } = parseYearMonthSearchParams(await searchParams);

  const result = await getDrinkReport(year, month);
  if (!result.success) throw new Error(result.message);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Getränke</h1>
        <p className="text-sm text-muted-foreground">
          Getränkebestand und Entnahmen pro Mitglied, nach Monat.
        </p>
      </div>
      <DrinkReportView
        year={year}
        month={month}
        initialCount={result.initialCount}
        totalTaken={result.totalTaken}
        rows={result.rows}
      />
    </div>
  );
}
