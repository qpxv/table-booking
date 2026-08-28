import "server-only";
import { prisma } from "@/lib/prisma";

export interface StoredPushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Every push subscription belonging to any of the given members. */
export async function getPushSubscriptionsForUsers(
  userIds: string[],
): Promise<StoredPushSubscription[]> {
  if (userIds.length === 0) return [];

  return prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
}
