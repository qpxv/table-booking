import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";

type AppShellUser = {
  name: string;
  email: string;
  role: string;
};

function NavButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      nativeButton={false}
      className="text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
      render={<Link href={href}>{children}</Link>}
    />
  );
}

export default function AppShell({
  user,
  children,
}: {
  user: AppShellUser;
  children: React.ReactNode;
}) {
  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b bg-header px-4 py-2 text-header-foreground">
        <Link href="/dashboard" className="grow text-lg font-semibold">
          Vereins-Tischbuchung
        </Link>
        <NavButton href="/dashboard">Dashboard</NavButton>
        <NavButton href="/tische">Tische</NavButton>
        {isAdmin && (
          <>
            <NavButton href="/admin/tische">Tischverwaltung</NavButton>
            <NavButton href="/admin/users">Benutzerverwaltung</NavButton>
          </>
        )}
        <UserMenu name={user.name} email={user.email} />
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
