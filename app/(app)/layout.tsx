import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { getDrinkWidgetData } from "@/lib/queries/drinks";
import AppShell from "@/components/layout/AppShell";
import RouteTransition from "@/components/layout/RouteTransition";
import ForcePasswordChange from "@/components/auth/ForcePasswordChange";
import NotificationProvider from "@/components/notifications/NotificationProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  // Kicked off before the session check so the two run in parallel: the drink
  // widget query derives its own session and doesn't depend on this one.
  const drinkPromise = getDrinkWidgetData();

  const session = await checkSession();

  // Gate the entire authenticated app behind the forced password change so a
  // member using an admin-provisioned password can't reach anything else.
  if ((session.user as { mustChangePassword?: boolean }).mustChangePassword) {
    return <ForcePasswordChange userName={session.user.name} />;
  }

  const drinkResult = await drinkPromise;
  if (!drinkResult.success) throw new Error(drinkResult.message);

  return (
    <NotificationProvider>
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
    </NotificationProvider>
  );
}
