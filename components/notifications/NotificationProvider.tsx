"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/service/push-service/push";

type Support = "loading" | "unsupported" | "ready";

interface NotificationState {
  support: Support;
  permission: NotificationPermission;
  isSubscribed: boolean;
  busy: boolean;
  /** Returns true on success. */
  enable: () => Promise<boolean>;
  /** Returns true on success. */
  disable: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationState | null>(null);

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// VAPID public key (base64url) to the byte buffer the Push API wants.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC_KEY
  );
}

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  // Starts "loading" on both server and client so first paint matches, then
  // resolves after hydration.
  const [support, setSupport] = useState<Support>("loading");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Deferred (not sync in the effect body) so it can't cascade renders.
    Promise.resolve().then(() => {
      if (!isSupported()) {
        setSupport("unsupported");
        return;
      }
      setPermission(Notification.permission);
      navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => {
          setIsSubscribed(!!subscription);
          setSupport("ready");
        })
        .catch(() => setSupport("unsupported"));
    });
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!isSupported() || !VAPID_PUBLIC_KEY) return false;
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return false;

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      const saved = await subscribeToPush(
        subscription.toJSON() as Parameters<typeof subscribeToPush>[0],
      );
      if (!saved.success) {
        await subscription.unsubscribe().catch(() => undefined);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe().catch(() => undefined);
      }
      setIsSubscribed(false);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ support, permission, isSubscribed, busy, enable, disable }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationState {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
