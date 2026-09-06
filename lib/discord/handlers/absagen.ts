import "server-only";
import { prisma } from "@/lib/prisma";
import { MESSAGES } from "@/lib/constants";
import { formatBerlin, formatEventDateRange } from "@/lib/datetime";
import { fetchUpcomingBookingsForUser } from "@/lib/queries/bookings-helpers";
import { cancelBooking } from "@/service/booking-service/booking";
import { ButtonStyle } from "../interactions";
import { ephemeralMessage, updateMessage } from "../responses";
import { getActorForInteraction } from "../actor";
import { deferActInto } from "../defer";
import { idFromCustomId } from "../ids";
import { stringSelectRow, buttonRow } from "../components";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

export async function handleAbsagen(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const resolution = await getActorForInteraction(interaction);
  if (!resolution.ok) return ephemeralMessage(resolution.error);

  const own = (await fetchUpcomingBookingsForUser(resolution.actor.id)).filter(
    (b) => b.userId === resolution.actor.id,
  );
  if (own.length === 0) {
    return ephemeralMessage("Du hast keine eigenen Buchungen zum Absagen.");
  }

  return ephemeralMessage("Welche Buchung absagen?", [
    stringSelectRow(
      "absagen_pick",
      MESSAGES.DISCORD.SELECT_BOOKING_PLACEHOLDER,
      own.map((b) => ({
        label: `${b.table.name} — ${formatBerlin(b.start, "dd.MM. HH:mm")}`,
        value: b.id,
      })),
    ),
  ]);
}

export async function handleAbsagenPick(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const bookingId = interaction.data?.values?.[0];
  if (!bookingId) return updateMessage(MESSAGES.DISCORD.ACTION_EXPIRED);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { table: { select: { name: true } } },
  });
  if (!booking) return updateMessage(MESSAGES.BOOKING.NOT_FOUND);

  return updateMessage(
    MESSAGES.DISCORD.CONFIRM_CANCEL_PREFIX +
      `${booking.table.name}, ${formatEventDateRange(booking.start, booking.end)}?`,
    [buttonRow(`absagen_confirm:${bookingId}`, "Absagen", ButtonStyle.DANGER)],
  );
}

export function handleAbsagenConfirm(
  interaction: DiscordInteraction,
): InteractionResponse {
  const bookingId = idFromCustomId(interaction.data?.custom_id);
  return deferActInto(interaction, (actor) => cancelBooking(bookingId, actor));
}
