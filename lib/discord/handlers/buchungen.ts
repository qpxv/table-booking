import "server-only";
import { formatEventDateRange } from "@/lib/datetime";
import { fetchUpcomingBookingsForUser } from "@/lib/queries/bookings-helpers";
import { ephemeralMessage } from "../responses";
import { getActorForInteraction } from "../actor";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

export async function handleBuchungen(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const resolution = await getActorForInteraction(interaction);
  if (!resolution.ok) return ephemeralMessage(resolution.error);

  const bookings = await fetchUpcomingBookingsForUser(resolution.actor.id);
  if (bookings.length === 0) {
    return ephemeralMessage("Du hast keine kommenden Buchungen.");
  }

  const lines = bookings.map((b) => {
    const parts = [`${b.table.name}: ${formatEventDateRange(b.start, b.end)}`];
    if (b.game) parts.push(b.game);
    parts.push(`${b.participants.length} dabei`);
    return parts.join(", ");
  });
  return ephemeralMessage(["Deine kommenden Buchungen:", ...lines].join("\n"));
}
