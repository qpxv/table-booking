import type { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import LinkPendingSpinner from "@/components/ui/link-pending-spinner";
import { ROLES, ROUTES } from "@/lib/constants";
import type { DrinkWidgetData } from "@/lib/drink-types";
import { DrinkWidgetHeaderButton } from "@/components/drinks/DrinkWidget";
import MobileNav from "./MobileNav";
import UserMenu from "./UserMenu";

type AppShellUser = {
  name: string;
  email: string;
  role: string;
  iban: string | null;
};

function NavButton({ href, children }: { href: string; children: React.ReactNode }): JSX.Element {
  return (
    <Button
      variant="ghost"
      nativeButton={false}
      className="text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
      render={
        <Link href={href}>
          {children}
          <LinkPendingSpinner />
        </Link>
      }
    />
  );
}

export default function AppShell({
  user,
  drinkWidget,
  children,
}: {
  user: AppShellUser;
  drinkWidget: DrinkWidgetData;
  children: React.ReactNode;
}): JSX.Element {
  const isAdmin = user.role === ROLES.ADMIN;

  const links = [
    { href: ROUTES.DASHBOARD, label: "Dashboard" },
    { href: ROUTES.TISCHE, label: "Reservieren" },
    { href: ROUTES.GASTHISTORIE, label: "Gasthistorie" },
    ...(isAdmin
      ? [
          { href: ROUTES.ADMIN_TISCHE, label: "Tischverwaltung" },
          { href: ROUTES.ADMIN_SPIELE, label: "Spielverwaltung" },
          { href: ROUTES.ADMIN_USERS, label: "Benutzerverwaltung" },
          { href: ROUTES.ADMIN_GETRAENKE, label: "Getränke" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 border-b bg-header px-4 py-3 text-header-foreground">
        <Link href={ROUTES.DASHBOARD} className="flex min-w-0 grow items-center gap-2 truncate">
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

        <MobileNav
          links={links}
          name={user.name}
          email={user.email}
          iban={user.iban}
          drinkWidget={drinkWidget}
        />

        <div className="hidden items-center gap-1 md:flex">
          <DrinkWidgetHeaderButton ownCount={drinkWidget.ownCount} guests={drinkWidget.guests} />
          <UserMenu name={user.name} email={user.email} iban={user.iban} />
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
