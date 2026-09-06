import "server-only";
import { MESSAGES } from "@/lib/constants";
import { ephemeralMessage } from "../responses";
import { getActorForInteraction } from "../actor";
import { unlinkDiscordAccount } from "@/service/user-service/discord-link";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

export async function handleTrennen(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const resolution = await getActorForInteraction(interaction);
  if (!resolution.ok) {
    return ephemeralMessage(MESSAGES.DISCORD.NOTHING_TO_UNLINK);
  }

  const result = await unlinkDiscordAccount(resolution.actor);
  return ephemeralMessage(result.message);
}
