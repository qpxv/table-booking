import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }
  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role ?? "user",
        iban: session.user.iban ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
