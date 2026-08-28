"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, Menu, Settings } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/use-sign-out";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { isNavGroup, type NavEntry, type NavGroup, type NavLeaf } from "./nav-types";
import type { DrinkWidgetData } from "@/lib/drink-types";
import { DrinkWidgetSidebarItem } from "@/components/drinks/DrinkWidget";
import ClubLogo from "./ClubLogo";
import ThemeSidebarControl from "@/components/theme/ThemeSidebarControl";
import { NotificationSidebarItem } from "@/components/notifications/NotificationControls";
import SettingsDialog from "./SettingsDialog";

// Scoped locally per AppShell instance, not the app root: this is a
// purely ephemeral mobile overlay, there's no persistent desktop sidebar
// state to share across the app.
export default function MobileNav({
  links,
  name,
  email,
  iban,
  drinkWidget,
}: {
  links: NavEntry[];
  name: string;
  email: string;
  iban: string | null;
  drinkWidget: DrinkWidgetData;
}): JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={false} className="contents">
      <EdgeSwipeToOpen />
      <MobileNavTrigger />
      <Sidebar side="right" collapsible="offcanvas">
        <SidebarHeader>
          <Link href={ROUTES.HOME} className="flex items-center gap-2 px-2 py-1.5 outline-hidden">
            <ClubLogo className="h-8 w-auto shrink-0" />
            <span className="truncate font-heading text-lg font-semibold">Dice-Bock e.V.</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {links.map((link) =>
                  isNavGroup(link) ? (
                    <NavGroupSection key={link.label} group={link} />
                  ) : (
                    <SidebarMenuItem key={link.href}>
                      <NavMenuButton link={link} />
                    </SidebarMenuItem>
                  ),
                )}
                <DrinkWidgetSidebarItem ownCount={drinkWidget.ownCount} guests={drinkWidget.guests} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <AccountFooter name={name} email={email} onOpenSettings={() => setSettingsOpen(true)} />
        </SidebarFooter>
      </Sidebar>
      {/* Rendered here, not inside AccountFooter: AccountFooter lives inside
          the Sidebar's own Sheet, which unmounts its children when the drawer
          closes. Since opening Settings also closes the drawer in the same
          click, the dialog's state has to live outside that subtree or it
          gets torn down before it can render. */}
      {settingsOpen && (
        <SettingsDialog
          name={name}
          email={email}
          iban={iban}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </SidebarProvider>
  );
}

// Right edge, matching the drawer's own side="right" slide-in direction.
const EDGE_ZONE_PX = 24;
const OPEN_THRESHOLD_PX = 50;

// Renders nothing: just listens for a right-edge swipe-left gesture and
// opens the drawer, like a native edge-swipe drawer. Passive listeners
// throughout (no preventDefault) so it never fights normal page scrolling.
function EdgeSwipeToOpen(): null {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isMobile || openMobile) return;

    function onTouchStart(e: TouchEvent): void {
      const touch = e.touches[0];
      if (window.innerWidth - touch.clientX <= EDGE_ZONE_PX) {
        startRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }

    function onTouchMove(e: TouchEvent): void {
      if (!startRef.current) return;
      const touch = e.touches[0];
      const deltaX = startRef.current.x - touch.clientX;
      const deltaY = startRef.current.y - touch.clientY;
      if (deltaX > OPEN_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY)) {
        setOpenMobile(true);
        startRef.current = null;
      }
    }

    function onTouchEnd(): void {
      startRef.current = null;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, openMobile, setOpenMobile]);

  return null;
}

function MobileNavTrigger(): JSX.Element {
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

function NavMenuButton({ link }: { link: NavLeaf }): JSX.Element {
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

function NavGroupSection({ group }: { group: NavGroup }): JSX.Element {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const containsActive = group.items.some((item) => item.href === pathname);
  const [open, setOpen] = useState(containsActive);

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {group.label}
          <ChevronDown
            className={cn("ml-auto transition-transform", open && "rotate-180")}
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
      {open && (
        <SidebarMenuSub>
          {group.items.map((item) => (
            <SidebarMenuSubItem key={item.href}>
              <SidebarMenuSubButton
                isActive={pathname === item.href}
                onClick={() => setOpenMobile(false)}
                render={<Link href={item.href}>{item.label}</Link>}
              />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </>
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
}): JSX.Element {
  const { setOpenMobile } = useSidebar();
  const handleLogout = useSignOut();

  return (
    <>
      <div className="flex flex-col px-2 py-1.5 text-sm">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </div>
      <ThemeSidebarControl />
      <SidebarMenu>
        <NotificationSidebarItem />
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
