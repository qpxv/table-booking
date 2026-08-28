"use client";

import { type JSX } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "./NotificationProvider";

const DENIED_HINT = "In den Browser-Einstellungen freigeben";
const ENABLED_TOAST = "Benachrichtigungen aktiviert.";
const DISABLED_TOAST = "Benachrichtigungen deaktiviert.";
const FAILED_TOAST = "Benachrichtigungen konnten nicht aktiviert werden.";

function useToggle(): {
  hidden: boolean;
  disabled: boolean;
  checked: boolean;
  denied: boolean;
  onToggle: (next: boolean) => void;
} {
  const { support, permission, isSubscribed, busy, enable, disable } = useNotifications();

  async function onToggle(next: boolean): Promise<void> {
    if (next) {
      const ok = await enable();
      toast[ok ? "success" : "error"](ok ? ENABLED_TOAST : FAILED_TOAST);
    } else {
      await disable();
      toast.success(DISABLED_TOAST);
    }
  }

  return {
    hidden: support === "unsupported",
    disabled: busy || support !== "ready" || permission === "denied",
    checked: isSubscribed,
    denied: permission === "denied",
    onToggle,
  };
}

/** Row for the avatar dropdown (desktop). */
export function NotificationMenuItem(): JSX.Element | null {
  const { hidden, disabled, checked, denied, onToggle } = useToggle();
  if (hidden) return null;

  return (
    <DropdownMenuItem
      closeOnClick={false}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        if (!disabled) onToggle(!checked);
      }}
    >
      <Bell />
      <span className="flex-1">Benachrichtigungen</span>
      {denied ? (
        <span className="text-xs text-muted-foreground">{DENIED_HINT}</span>
      ) : (
        <Switch checked={checked} disabled={disabled} tabIndex={-1} />
      )}
    </DropdownMenuItem>
  );
}

/** Row for the mobile sidebar drawer. */
export function NotificationSidebarItem(): JSX.Element | null {
  const { hidden, disabled, checked, denied, onToggle } = useToggle();
  if (hidden) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        disabled={disabled}
        onClick={() => {
          if (!disabled) onToggle(!checked);
        }}
      >
        <Bell />
        <span className="flex-1">Benachrichtigungen</span>
        {denied ? (
          <span className="text-xs text-muted-foreground">{DENIED_HINT}</span>
        ) : (
          <Switch checked={checked} disabled={disabled} tabIndex={-1} />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
