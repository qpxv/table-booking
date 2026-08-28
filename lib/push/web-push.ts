import "server-only";
import webpush, { WebPushError } from "web-push";
import { prisma } from "@/lib/prisma";
import { getPushSubscriptionsForUsers } from "@/lib/queries/push-subscriptions";
import type { PushPayload } from "@/lib/push/push-types";

let configured = false;

// Lazy so a missing key only breaks push, not the whole server on import.
function configure(): boolean {
  if (configured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    console.error(
      "web-push not configured: set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT",
    );
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

// A push service returns 404/410 when the subscription is permanently gone
// (browser uninstalled, user cleared site data). Anything else is transient.
function isGone(err: unknown): err is WebPushError {
  return err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410);
}

/**
 * Fire-and-forget notification delivery to every device of the given members.
 * Never throws: a failed push must not fail the action that triggered it.
 * Call sites should wrap this in `after()` so it runs off the response path.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  const recipients = [...new Set(userIds)].filter(Boolean);
  if (recipients.length === 0 || !configure()) return;

  const subscriptions = await getPushSubscriptionsForUsers(recipients);
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(payload);
  const staleIds: string[] = [];

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
      ),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === "fulfilled") return;
    const reason = result.reason;
    if (isGone(reason)) {
      staleIds.push(subscriptions[index].id);
    } else {
      console.error("push send failed", reason);
    }
  });

  if (staleIds.length > 0) {
    await prisma.pushSubscription
      .deleteMany({ where: { id: { in: staleIds } } })
      .catch((err: unknown) => console.error("failed pruning stale push subscriptions", err));
  }
}
