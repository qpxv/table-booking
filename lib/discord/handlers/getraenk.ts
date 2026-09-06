import "server-only";
import { MESSAGES } from "@/lib/constants";
import { adjustDrinkCount } from "@/service/drink-service/drink";
import { getOwnDrinkCount } from "@/lib/queries/drinks";
import { ephemeralMessage } from "../responses";
import { getSubcommand } from "../options";
import { getActorForInteraction } from "../actor";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

export async function handleGetraenk(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const resolution = await getActorForInteraction(interaction);
  if (!resolution.ok) return ephemeralMessage(resolution.error);

  const sub = interaction.data ? getSubcommand(interaction.data) : null;
  const delta = sub?.name === "add" ? 1 : sub?.name === "remove" ? -1 : null;
  if (delta === null) return ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR);

  const result = await adjustDrinkCount(delta, resolution.actor);
  if (!result.success) return ephemeralMessage(result.message);

  const count = await getOwnDrinkCount(resolution.actor.id);
  return ephemeralMessage(`${result.message} ${MESSAGES.DISCORD.drinkCount(count)}`);
}
