import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tische", label: "Tische" },
    ...(isAdmin
      ? [
          { href: "/admin/tische", label: "Tischverwaltung" },
          { href: "/admin/users", label: "Benutzerverwaltung" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-2 border-b bg-header px-4 py-2 text-header-foreground">
        <Link href="/dashboard" className="flex min-w-0 grow items-center gap-2 truncate">
          <Image
            src="/club-logo-dark.png"
            alt=""
            width={444}
            height={509}
            priority
            className="h-8 w-auto shrink-0"
          />
          <span className="truncate font-heading text-lg font-semibold">Dice-Bock e.V.</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavButton key={link.href} href={link.href}>
              {link.label}
            </NavButton>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground aria-expanded:bg-header-foreground/10 aria-expanded:text-header-foreground md:hidden"
              />
            }
          >
            <Menu />
            <span className="sr-only">Menü</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {links.map((link) => (
              <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
                {link.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <UserMenu name={user.name} email={user.email} />
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
