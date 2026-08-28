"use client";

import { type JSX } from "react";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "./NotificationProvider";

// Deliberately not dismissible: being reachable is a core point of the app,
// so members who haven't opted in keep seeing this until they do (or the
// browser can't support it at all).
export default function EnableNotificationsNudge(): JSX.Element | null {
  const { support, permission, isSubscribed, busy, enable } = useNotifications();

  if (support !== "ready" || isSubscribed) return null;

  const denied = permission === "denied";

  async function onEnable(): Promise<void> {
    const ok = await enable();
    toast[ok ? "success" : "error"](
      ok
        ? "Benachrichtigungen aktiviert."
        : "Benachrichtigungen konnten nicht aktiviert werden.",
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
      <BellRing className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="flex flex-1 flex-col gap-2">
        <div>
          <p className="font-medium">Benachrichtigungen sind aus</p>
          <p className="text-muted-foreground">
            {denied
              ? "Du hast Benachrichtigungen blockiert. Gib sie in den Browser-Einstellungen für diese Seite wieder frei, damit du nichts verpasst."
              : "Aktiviere Benachrichtigungen, damit du erfährst, wenn dich jemand zu einem Termin hinzufügt, ein Event abgesagt wird oder jemand auf deine Spielersuche antwortet."}
          </p>
        </div>
        {!denied && (
          <Button size="sm" className="self-start" disabled={busy} onClick={onEnable}>
            Aktivieren
          </Button>
        )}
      </div>
    </div>
  );
}
