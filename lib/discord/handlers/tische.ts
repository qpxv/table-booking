import "server-only";
import { MESSAGES } from "@/lib/constants";
import { formatBerlin, berlinDayString, berlinDayRange } from "@/lib/datetime";
import { fetchBookingsForBerlinDay } from "@/lib/queries/bookings-helpers";
import { ephemeralMessage } from "../responses";
import { getStringOption } from "../options";
import { parseGermanDateTime } from "../parse-datetime";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

export async function handleTische(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const datum = getStringOption(interaction.data?.options ?? [], "datum") ?? "";
  const parsed = parseGermanDateTime(datum, "12:00", null);
  if (!parsed.ok) return ephemeralMessage(MESSAGES.DISCORD.INVALID_DATETIME);

  const dayString = berlinDayString(parsed.start);
  const { start, end } = berlinDayRange(dayString);
  const dayLabel = formatBerlin(parsed.start, "dd.MM.yyyy");

  const bookings = await fetchBookingsForBerlinDay(start, end);
  if (bookings.length === 0) {
    return ephemeralMessage(MESSAGES.DISCORD.tischeDayEmpty(dayLabel));
  }

  const byTable = new Map<string, string[]>();
  for (const b of bookings) {
    const line = `${formatBerlin(b.start, "HH:mm")}–${formatBerlin(b.end, "HH:mm")} (${b.user.name})`;
    const list = byTable.get(b.table.name) ?? [];
    list.push(line);
    byTable.set(b.table.name, list);
  }

  const blocks = [...byTable.entries()].map(
    ([table, lines]) => `**${table}**\n${lines.join("\n")}`,
  );
  return ephemeralMessage([`Belegung am ${dayLabel}:`, ...blocks].join("\n\n"));
}
