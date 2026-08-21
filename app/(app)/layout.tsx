import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const session = await checkSession();

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role ?? ROLES.USER,
        iban: session.user.iban ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
