"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import SettingsDialog from "./SettingsDialog";

type NavLink = { href: string; label: string };

// Scoped locally per AppShell instance, not the app root — this is a
// purely ephemeral mobile overlay, there's no persistent desktop sidebar
// state to share across the app.
export default function MobileNav({
  links,
  name,
  email,
}: {
  links: NavLink[];
  name: string;
  email: string;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={false} className="contents">
      <MobileNavTrigger />
      <Sidebar side="right" collapsible="offcanvas">
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
            <Image
              src="/club-logo-light.png"
              alt=""
              width={444}
              height={509}
              className="h-8 w-auto shrink-0"
            />
            <span className="truncate font-heading text-lg font-semibold">Dice-Bock e.V.</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {links.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <NavMenuButton link={link} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <AccountFooter name={name} email={email} onOpenSettings={() => setSettingsOpen(true)} />
        </SidebarFooter>
      </Sidebar>
      {/* Rendered here, not inside AccountFooter — AccountFooter lives inside
          the Sidebar's own Sheet, which unmounts its children when the drawer
          closes. Since opening Settings also closes the drawer in the same
          click, the dialog's state has to live outside that subtree or it
          gets torn down before it can render. */}
      {settingsOpen && (
        <SettingsDialog name={name} email={email} onClose={() => setSettingsOpen(false)} />
      )}
    </SidebarProvider>
  );
}

function MobileNavTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground md:hidden"
      onClick={toggleSidebar}
    >
      <Menu />
      <span className="sr-only">Menü</span>
    </Button>
  );
}

function NavMenuButton({ link }: { link: NavLink }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton
      isActive={pathname === link.href}
      onClick={() => setOpenMobile(false)}
      render={<Link href={link.href}>{link.label}</Link>}
    />
  );
}

function AccountFooter({
  name,
  email,
  onOpenSettings,
}: {
  name: string;
  email: string;
  onOpenSettings: () => void;
}) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col px-2 py-1.5 text-sm">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </div>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => {
              setOpenMobile(false);
              onOpenSettings();
            }}
          >
            <Settings />
            Einstellungen
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={handleLogout}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut />
            Abmelden
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
