import "server-only";
import { MESSAGES } from "@/lib/constants";
import { formatBerlin } from "@/lib/datetime";
import {
  createPlayerSearch,
  deletePlayerSearch,
  acceptPlayerSearchInterest,
  declinePlayerSearchInterest,
} from "@/service/player-search-service/player-search";
import {
  listOwnOpenPlayerSearches,
  listActionableInterestsForCreator,
} from "@/lib/queries/player-search";
import { ButtonStyle } from "../interactions";
import { ephemeralMessage, updateMessage } from "../responses";
import {
  getSubcommand,
  getStringOption,
  getIntegerOption,
} from "../options";
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

export async function handleSpielersuche(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const resolution = await getActorForInteraction(interaction);
  if (!resolution.ok) return ephemeralMessage(resolution.error);

  const sub = interaction.data ? getSubcommand(interaction.data) : null;
  if (!sub) return ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR);

  switch (sub.name) {
    case "open":
      return openSearch(sub.options, resolution.actor);
    case "close": {
      const searches = await listOwnOpenPlayerSearches(resolution.actor.id);
      if (searches.length === 0) return ephemeralMessage(MESSAGES.DISCORD.NOTHING_TO_SHOW);
      return ephemeralMessage("Spielersuche auswählen:", [
        stringSelectRow(
          "ss_close_pick",
          MESSAGES.DISCORD.SELECT_SEARCH_PLACEHOLDER,
          searches.map((s) => ({
            label: `${s.system}, ${s.matchType}`,
            value: s.id,
            description: s.start ? formatBerlin(s.start, "dd.MM. HH:mm") : "flexibel",
          })),
        ),
      ]);
    }
    case "accept":
    case "decline": {
      const interests = await listActionableInterestsForCreator(resolution.actor.id);
      if (interests.length === 0) return ephemeralMessage(MESSAGES.DISCORD.NOTHING_TO_SHOW);
      return ephemeralMessage("Anfrage auswählen:", [
        stringSelectRow(
          sub.name === "accept" ? "ss_accept_pick" : "ss_decline_pick",
          MESSAGES.DISCORD.SELECT_INTEREST_PLACEHOLDER,
          interests.map((i) => ({
            label: `${i.responderName} — ${i.system}`,
            value: i.id,
            description: formatBerlin(i.proposedStart, "dd.MM. HH:mm"),
          })),
        ),
      ]);
    }
    default:
      return ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR);
  }
}

async function openSearch(
  options: DiscordCommandOption[],
  actor: Actor,
): Promise<InteractionResponse> {
  const system = getStringOption(options, "system") ?? "";
  const matchtyp = getStringOption(options, "matchtyp");
  const zeit = getStringOption(options, "zeit");
  const spieler = getIntegerOption(options, "spieler");

  let start: Date | undefined;
  let end: Date | undefined;
  if (zeit) {
    const parsed = parseCombinedDateTime(zeit, null);
    if (!parsed.ok) return ephemeralMessage(MESSAGES.DISCORD.INVALID_DATETIME);
    start = parsed.start;
    end = parsed.end;
  }

  const result = await createPlayerSearch(
    {
      fixedTime: Boolean(zeit),
      start,
      end,
      system,
      matchType: matchtyp ?? system,
      playerCount: spieler ?? 2,
    },
    actor,
  );
  return ephemeralMessage(result.message);
}

// --- component callbacks --------------------------------------------------

export async function handleSpielersucheCloseSelect(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const searchId = interaction.data?.values?.[0];
  if (!searchId) return updateMessage(MESSAGES.DISCORD.ACTION_EXPIRED);
  return updateMessage(MESSAGES.DISCORD.CONFIRM_DELETE_SEARCH_PREFIX + "?", [
    buttonRow(`ss_close_confirm:${searchId}`, "Löschen", ButtonStyle.DANGER),
  ]);
}

export async function handleSpielersucheCloseConfirm(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  return deferActInto(interaction, (actor) =>
    deletePlayerSearch(idFromCustomId(interaction.data?.custom_id), actor),
  );
}

export async function handleSpielersucheAcceptSelect(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  return deferActInto(interaction, (actor) =>
    acceptPlayerSearchInterest(interaction.data?.values?.[0] ?? "", actor),
  );
}

export async function handleSpielersucheDeclineSelect(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  return deferActInto(interaction, (actor) =>
    declinePlayerSearchInterest(interaction.data?.values?.[0] ?? "", actor),
  );
}
