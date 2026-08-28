"use server";

import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MESSAGES } from "@/lib/constants";
import { pushSubscriptionSchema } from "@/lib/schemas/push";
import type { PushSubscriptionInput } from "@/lib/schemas/push";
import type { ServiceResult } from "@/lib/service-types";

export async function subscribeToPush(input: PushSubscriptionInput): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  const { endpoint, keys } = parsed.data;
  const userAgent = (await headers()).get("user-agent");

  try {
    // Upsert on endpoint: the same device re-subscribing (or a shared browser
    // now used by another member) re-points the row to the current user.
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        userId: session.user.id,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        userId: session.user.id,
      },
    });

    return { success: true, message: MESSAGES.COMMON.OK };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in subscribeToPush", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function unsubscribeFromPush(endpoint: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });

    return { success: true, message: MESSAGES.COMMON.OK };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in unsubscribeFromPush", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
