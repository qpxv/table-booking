import { Suspense, type JSX } from "react";
import { parseYearMonthSearchParams } from "@/lib/datetime";
import DrinkReportContent from "@/components/drinks/DrinkReportContent";
import DrinkReportSkeleton from "@/components/drinks/DrinkReportSkeleton";

export default async function AdminDrinksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<JSX.Element> {
  const { year, month } = parseYearMonthSearchParams(await searchParams);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Getränke</h1>
        <p className="text-sm text-muted-foreground">
          Getränkebestand und Entnahmen pro Mitglied, nach Monat.
        </p>
      </div>
      <Suspense key={`${year}-${month}`} fallback={<DrinkReportSkeleton />}>
        <DrinkReportContent year={year} month={month} />
      </Suspense>
    </div>
  );
}
