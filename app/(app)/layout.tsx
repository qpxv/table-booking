import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { getDrinkWidgetData } from "@/lib/queries/drinks";
import AppShell from "@/components/layout/AppShell";
import RouteTransition from "@/components/layout/RouteTransition";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const session = await checkSession();

  const drinkResult = await getDrinkWidgetData();
  if (!drinkResult.success) throw new Error(drinkResult.message);

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role ?? ROLES.USER,
        iban: session.user.iban ?? null,
      }}
      drinkWidget={{ ownCount: drinkResult.ownCount, guests: drinkResult.guests }}
    >
      <RouteTransition>{children}</RouteTransition>
    </AppShell>
  );
}
