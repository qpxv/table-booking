"use client";

import { useSyncExternalStore, type JSX } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { THEME_OPTIONS } from "./theme-options";

const noopSubscribe = (): (() => void) => () => {};

// False during SSR and the first client render, true afterwards, without a
// setState-in-effect. next-themes only knows the stored theme on the
// client, so the active button stays unresolved until this flips, keeping
// server and client markup identical (the sidebar is server-rendered).
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// Compact segmented control for the mobile sidebar footer.
export default function ThemeSidebarControl(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const activeTheme = hydrated ? theme : undefined;

  return (
    <div className="flex items-center gap-1 px-2 py-1.5">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const isActive = activeTheme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={label}
            aria-pressed={isActive}
            className={cn(
              "flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors [&_svg]:size-4",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
