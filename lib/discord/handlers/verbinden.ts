import "server-only";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { MESSAGES, ROUTES } from "@/lib/constants";
import { discordEnv } from "../env";
import { ephemeralMessage } from "../responses";
import { discordUserIdOf } from "../actor";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

const LINK_IDENTIFIER = "discord-link";
const TOKEN_TTL_MS = 10 * 60 * 1000;

export async function handleVerbinden(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const discordUserId = discordUserIdOf(interaction);
  if (!discordUserId) return ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR);

  const user = interaction.member?.user;
  const discordUsername = user?.global_name || user?.username || "";

  const alreadyLinked = await prisma.user.findUnique({
    where: { discordUserId },
    select: { id: true },
  });
  if (alreadyLinked) return ephemeralMessage(MESSAGES.DISCORD.ALREADY_LINKED_SELF);

  const token = randomUUID();
  await prisma.verification.create({
    data: {
      identifier: LINK_IDENTIFIER,
      value: `${token}:${discordUserId}:${discordUsername}`,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const url = `${discordEnv.appBaseUrl}${ROUTES.DISCORD_VERBINDEN}?token=${token}`;
  return ephemeralMessage(MESSAGES.DISCORD.linkPrompt(url));
}
