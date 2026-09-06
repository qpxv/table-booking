import "server-only";
import { prisma } from "@/lib/prisma";
import { ROLES, MESSAGES } from "@/lib/constants";
import type { Actor } from "@/lib/actor";
import type { DiscordInteraction } from "@/lib/discord-types";

export type ActorResolution =
  | { ok: true; actor: Actor; discordUserId: string }
  | { ok: false; error: string };

/** The Discord snowflake of whoever triggered the interaction. */
export function discordUserIdOf(interaction: DiscordInteraction): string | null {
  return interaction.member?.user.id ?? interaction.user?.id ?? null;
}

/**
 * Map the Discord user to an app `User` via our own link table. Identity is
 * never taken from Discord-supplied names/ids for anything but this lookup.
 */
export async function getActorForInteraction(
  interaction: DiscordInteraction,
): Promise<ActorResolution> {
  const discordUserId = discordUserIdOf(interaction);
  if (!discordUserId) return { ok: false, error: MESSAGES.DISCORD.NOT_LINKED };

  const user = await prisma.user.findUnique({
    where: { discordUserId },
    select: { id: true, name: true, role: true },
  });
  if (!user) return { ok: false, error: MESSAGES.DISCORD.NOT_LINKED };

  return {
    ok: true,
    discordUserId,
    actor: { id: user.id, name: user.name, role: user.role ?? ROLES.USER },
  };
}
