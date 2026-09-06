"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { type Actor, resolveActor } from "@/lib/actor";
import { MESSAGES, ROUTES } from "@/lib/constants";
import type { ServiceResult } from "@/lib/service-types";

// Reuses the Better Auth `Verification` table (no dedicated model) for the
// short-lived link token. `value` is `<token>:<discordUserId>:<discordUsername>`.
const LINK_IDENTIFIER = "discord-link";

interface ParsedLinkToken {
  discordUserId: string;
  discordUsername: string | null;
}

function parseLinkValue(value: string): ParsedLinkToken | null {
  const [, discordUserId, ...usernameParts] = value.split(":");
  if (!discordUserId) return null;
  return {
    discordUserId,
    discordUsername: usernameParts.join(":") || null,
  };
}

/**
 * Consume a `/verbinden` token and attach the Discord account to the calling
 * member's `User`. The token is single-use and bound to the Discord user id it
 * was issued for; this step still runs under the member's authenticated
 * session (web) or explicit actor (never from Discord directly).
 */
export async function linkDiscordAccount(
  token: string,
  explicitActor?: Actor,
): Promise<ServiceResult> {
  const actor = await resolveActor(explicitActor);
  if (!actor) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };
  if (!token || token.length > 100) {
    return { success: false, message: MESSAGES.DISCORD.LINK_EXPIRED };
  }

  try {
    const row = await prisma.verification.findFirst({
      where: { identifier: LINK_IDENTIFIER, value: { startsWith: `${token}:` } },
    });
    if (!row || row.expiresAt < new Date()) {
      return { success: false, message: MESSAGES.DISCORD.LINK_EXPIRED };
    }

    const parsed = parseLinkValue(row.value);
    if (!parsed) return { success: false, message: MESSAGES.DISCORD.LINK_EXPIRED };
    const { discordUserId, discordUsername } = parsed;

    const currentUser = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { discordUserId: true },
    });
    if (currentUser?.discordUserId && currentUser.discordUserId !== discordUserId) {
      return { success: false, message: MESSAGES.DISCORD.ALREADY_LINKED_SELF };
    }

    const taken = await prisma.user.findUnique({
      where: { discordUserId },
      select: { id: true },
    });
    if (taken && taken.id !== actor.id) {
      return { success: false, message: MESSAGES.DISCORD.ALREADY_LINKED_OTHER };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: actor.id },
        data: { discordUserId, discordUsername },
      }),
      prisma.verification.deleteMany({
        where: { identifier: LINK_IDENTIFIER, value: { startsWith: `${token}:` } },
      }),
    ]);

    revalidatePath(ROUTES.DISCORD_VERBINDEN);
    revalidatePath(ROUTES.DASHBOARD, "layout");
    return { success: true, message: MESSAGES.DISCORD.LINKED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in linkDiscordAccount", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function unlinkDiscordAccount(
  explicitActor?: Actor,
): Promise<ServiceResult> {
  const actor = await resolveActor(explicitActor);
  if (!actor) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  try {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { discordUserId: true },
    });
    if (!user?.discordUserId) {
      return { success: false, message: MESSAGES.DISCORD.NOTHING_TO_UNLINK };
    }

    await prisma.user.update({
      where: { id: actor.id },
      data: { discordUserId: null, discordUsername: null },
    });

    revalidatePath(ROUTES.DASHBOARD, "layout");
    return { success: true, message: MESSAGES.DISCORD.UNLINKED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in unlinkDiscordAccount", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
