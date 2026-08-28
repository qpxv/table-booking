import type { JSX } from "react";
import { getDrinkReport } from "@/lib/queries/drinks";
import DrinkReportView from "@/components/drinks/DrinkReportView";

export default async function DrinkReportContent({
  year,
  month,
}: {
  year: number;
  month: number;
}): Promise<JSX.Element> {
  const result = await getDrinkReport(year, month);
  if (!result.success) throw new Error(result.message);

  return (
    <DrinkReportView
      year={year}
      month={month}
      initialCount={result.initialCount}
      totalTaken={result.totalTaken}
      rows={result.rows}
    />
  );
}
