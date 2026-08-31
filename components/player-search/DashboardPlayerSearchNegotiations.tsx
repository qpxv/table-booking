import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { listPlayerSearchNegotiations } from "@/lib/queries/player-search";
import DashboardPlayerSearchNegotiationCard from "./DashboardPlayerSearchNegotiationCard";

export default async function DashboardPlayerSearchNegotiations(): Promise<JSX.Element | null> {
  const session = await checkSession();

  const result = await listPlayerSearchNegotiations(session.user.id);
  if (!result.success) throw new Error(result.message);
  if (result.negotiations.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">Spielersuche: Terminabsprache</h2>
      <div className="flex flex-col gap-3">
        {result.negotiations.map((negotiation) => (
          <DashboardPlayerSearchNegotiationCard key={negotiation.id} negotiation={negotiation} />
        ))}
      </div>
    </section>
  );
}
