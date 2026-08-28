import "server-only";
import { after } from "next/server";
import { sendPushToUsers } from "@/lib/push/web-push";
import type { NotificationCopy } from "@/lib/push/push-types";

/**
 * Queue a push notification to every device of `userIds`, off the response
 * path (runs after the action's response is sent). Safe to call with an
 * empty or actor-inclusive list; de-dupes and drops falsy ids.
 */
export function notify(
  userIds: string[],
  copy: NotificationCopy,
  url: string,
  tag?: string,
): void {
  const recipients = [...new Set(userIds)].filter(Boolean);
  if (recipients.length === 0) return;
  after(() => sendPushToUsers(recipients, { ...copy, url, tag }));
}
