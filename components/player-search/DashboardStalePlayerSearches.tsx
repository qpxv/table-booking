import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { listStalePlayerSearchesForUser } from "@/lib/queries/player-search";
import DashboardStalePlayerSearchCard from "./DashboardStalePlayerSearchCard";

export default async function DashboardStalePlayerSearches(): Promise<JSX.Element | null> {
  const session = await checkSession();

  const result = await listStalePlayerSearchesForUser(session.user.id);
  if (!result.success) throw new Error(result.message);
  if (result.searches.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">Spielersuche prüfen</h2>
      <div className="flex flex-col gap-3">
        {result.searches.map((search) => (
          <DashboardStalePlayerSearchCard key={search.id} search={search} />
        ))}
      </div>
    </section>
  );
}
