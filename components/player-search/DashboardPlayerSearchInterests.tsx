import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { listIncomingPlayerSearchInterests } from "@/lib/queries/player-search";
import DashboardPlayerSearchInterestCard from "./DashboardPlayerSearchInterestCard";

export default async function DashboardPlayerSearchInterests(): Promise<JSX.Element | null> {
  const session = await checkSession();

  const result = await listIncomingPlayerSearchInterests(session.user.id);
  if (!result.success) throw new Error(result.message);
  if (result.interests.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">Anfragen für deine Spielersuche</h2>
      <div className="flex flex-col gap-3">
        {result.interests.map((interest) => (
          <DashboardPlayerSearchInterestCard key={interest.id} interest={interest} />
        ))}
      </div>
    </section>
  );
}
