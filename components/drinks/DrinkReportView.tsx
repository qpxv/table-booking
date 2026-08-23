"use client";

import { useState, useTransition, type JSX } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/ui/data-table";
import { ROUTES, SEARCH_PARAMS } from "@/lib/constants";
import { setDrinkBudget } from "@/service/drink-service/drink";
import { showToast } from "@/lib/toast";
import type { DrinkReportRow } from "@/lib/drink-types";
import MonthPicker from "./MonthPicker";
import { drinkReportColumns } from "./columns";

export default function DrinkReportView({
  year,
  month,
  initialCount,
  totalTaken,
  rows,
}: {
  year: number;
  month: number;
  initialCount: number;
  totalTaken: number;
  rows: DrinkReportRow[];
}): JSX.Element {
  const router = useRouter();
  const [budgetInput, setBudgetInput] = useState(String(initialCount));
  const [pending, startTransition] = useTransition();

  function handleMonthChange(nextYear: number, nextMonth: number): void {
    const params = new URLSearchParams({
      [SEARCH_PARAMS.YEAR]: String(nextYear),
      [SEARCH_PARAMS.MONTH]: String(nextMonth),
    });
    router.push(`${ROUTES.ADMIN_GETRAENKE}?${params.toString()}`);
  }

  function handleSaveBudget(): void {
    startTransition(async () => {
      const result = await setDrinkBudget(year, month, budgetInput);
      showToast(result);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <MonthPicker year={year} month={month} onChange={handleMonthChange} />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Entnommen / Bestand</p>
            <p className="text-2xl font-semibold tabular-nums">
              {totalTaken} / {initialCount}
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="drink-budget" className="text-sm text-muted-foreground">
                Bestand für diesen Monat
              </label>
              <Input
                id="drink-budget"
                type="number"
                min={0}
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-28"
              />
            </div>
            <Button onClick={handleSaveBudget} disabled={pending}>
              {pending ? <Spinner /> : <Save />}
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={drinkReportColumns} data={rows} />
    </div>
  );
}
