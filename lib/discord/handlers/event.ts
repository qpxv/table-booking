import "server-only";
import { MESSAGES } from "@/lib/constants";
import { actorIsAdmin } from "@/lib/actor";
import { formatBerlin } from "@/lib/datetime";
import {
  createEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
} from "@/service/event-service/event";
import { listUpcomingEventsBasic } from "@/lib/queries/events";
import { ButtonStyle } from "../interactions";
import { ephemeralMessage, updateMessage } from "../responses";
import { getSubcommand, getStringOption } from "../options";
import { getActorForInteraction } from "../actor";
import { deferActInto } from "../defer";
import { idFromCustomId } from "../ids";
import { stringSelectRow, buttonRow } from "../components";
import { parseCombinedDateTime } from "../parse-datetime";
import type { Actor } from "@/lib/actor";
import type {
  DiscordCommandOption,
  DiscordInteraction,
  InteractionResponse,
} from "@/lib/discord-types";

export async function handleEvent(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const resolution = await getActorForInteraction(interaction);
  if (!resolution.ok) return ephemeralMessage(resolution.error);
  const actor = resolution.actor;

  const sub = interaction.data ? getSubcommand(interaction.data) : null;
  if (!sub) return ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR);

  switch (sub.name) {
    case "create":
      if (!actorIsAdmin(actor)) return ephemeralMessage(MESSAGES.DISCORD.NOT_ADMIN);
      return createFromOptions(sub.options, actor);
    case "delete": {
      if (!actorIsAdmin(actor)) return ephemeralMessage(MESSAGES.DISCORD.NOT_ADMIN);
      const events = await listUpcomingEventsBasic(actor.id);
      if (events.length === 0) return ephemeralMessage(MESSAGES.DISCORD.NOTHING_TO_SHOW);
      return ephemeralMessage("Event auswählen:", [
        stringSelectRow(
          "event_delete_pick",
          MESSAGES.DISCORD.SELECT_EVENT_PLACEHOLDER,
          events.map((e) => ({
            label: e.title,
            value: e.id,
            description: formatBerlin(e.start, "dd.MM. HH:mm"),
          })),
        ),
      ]);
    }
    case "join":
    case "leave": {
      const events = await listUpcomingEventsBasic(actor.id);
      const relevant =
        sub.name === "join" ? events.filter((e) => !e.joined) : events.filter((e) => e.joined);
      if (relevant.length === 0) return ephemeralMessage(MESSAGES.DISCORD.NOTHING_TO_SHOW);
      return ephemeralMessage(sub.name === "join" ? "Event auswählen:" : "Event auswählen:", [
        stringSelectRow(
          sub.name === "join" ? "event_join_pick" : "event_leave_pick",
          MESSAGES.DISCORD.SELECT_EVENT_PLACEHOLDER,
          relevant.map((e) => ({
            label: e.title,
            value: e.id,
            description: formatBerlin(e.start, "dd.MM. HH:mm"),
          })),
        ),
      ]);
    }
    default:
      return ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR);
  }
}

async function createFromOptions(
  options: DiscordCommandOption[],
  actor: Actor,
): Promise<InteractionResponse> {
  const titel = getStringOption(options, "titel") ?? "";
  const startRaw = getStringOption(options, "start") ?? "";
  const dauer = getStringOption(options, "dauer");
  const ort = getStringOption(options, "ort");
  const beschreibung = getStringOption(options, "beschreibung");

  const parsed = parseCombinedDateTime(startRaw, dauer);
  if (!parsed.ok) return ephemeralMessage(MESSAGES.DISCORD.INVALID_DATETIME);

  const result = await createEvent(
    {
      title: titel,
      start: parsed.start,
      // No `dauer` given -> event has no end.
      end: dauer ? parsed.end : undefined,
      location: ort ?? undefined,
      description: beschreibung ?? undefined,
    },
    actor,
  );
  return ephemeralMessage(result.message);
}

// --- component callbacks --------------------------------------------------

export function handleEventDeleteSelect(
  interaction: DiscordInteraction,
): InteractionResponse {
  const eventId = interaction.data?.values?.[0];
  if (!eventId) return updateMessage(MESSAGES.DISCORD.ACTION_EXPIRED);
  return updateMessage(MESSAGES.DISCORD.CONFIRM_DELETE_EVENT_PREFIX + "?", [
    buttonRow(`event_delete_confirm:${eventId}`, "Löschen", ButtonStyle.DANGER),
  ]);
}

export function handleEventDeleteConfirm(
  interaction: DiscordInteraction,
): InteractionResponse {
  return deferActInto(interaction, (actor) =>
    deleteEvent(idFromCustomId(interaction.data?.custom_id), actor),
  );
}

export function handleEventJoinSelect(
  interaction: DiscordInteraction,
): InteractionResponse {
  return deferActInto(interaction, (actor) =>
    joinEvent(interaction.data?.values?.[0] ?? "", actor),
  );
}

export function handleEventLeaveSelect(
  interaction: DiscordInteraction,
): InteractionResponse {
  return deferActInto(interaction, (actor) =>
    leaveEvent(interaction.data?.values?.[0] ?? "", actor),
  );
}
