import { InteractionType } from "discord-interactions";
import { MESSAGES } from "@/lib/constants";
import { verifyDiscordRequest } from "@/lib/discord/verify";
import { discordEnv } from "@/lib/discord/env";
import { pong, ephemeralMessage } from "@/lib/discord/responses";
import { handleVerbinden } from "@/lib/discord/handlers/verbinden";
import { handleTrennen } from "@/lib/discord/handlers/trennen";
import { handleAutocomplete } from "@/lib/discord/handlers/autocomplete";
import {
  handleBuchen,
  handleBuchenTableSelect,
  handleBuchenMemberSelect,
  handleBuchenConfirm,
} from "@/lib/discord/handlers/buchen";
import { handleTische } from "@/lib/discord/handlers/tische";
import { handleBuchungen } from "@/lib/discord/handlers/buchungen";
import {
  handleAbsagen,
  handleAbsagenPick,
  handleAbsagenConfirm,
} from "@/lib/discord/handlers/absagen";
import {
  handleSpielersuche,
  handleSpielersucheCloseSelect,
  handleSpielersucheCloseConfirm,
  handleSpielersucheAcceptSelect,
  handleSpielersucheDeclineSelect,
} from "@/lib/discord/handlers/spielersuche";
import {
  handleEvent,
  handleEventDeleteSelect,
  handleEventDeleteConfirm,
  handleEventJoinSelect,
  handleEventLeaveSelect,
} from "@/lib/discord/handlers/event";
import { handleGetraenk } from "@/lib/discord/handlers/getraenk";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

// Discord POSTs every interaction here. Reachable unauthenticated (proxy.ts
// excludes /api); each request is authenticated by its Ed25519 signature.
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();

  const valid = await verifyDiscordRequest(
    raw,
    req.headers.get("x-signature-ed25519"),
    req.headers.get("x-signature-timestamp"),
  );
  if (!valid) return new Response("invalid request signature", { status: 401 });

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(raw) as DiscordInteraction;
  } catch {
    return new Response("bad request", { status: 400 });
  }

  if (interaction.type === InteractionType.PING) {
    return Response.json(pong());
  }

  // Guild-install only: no DMs, no other servers.
  if (interaction.guild_id !== discordEnv.guildId) {
    return Response.json(ephemeralMessage(MESSAGES.DISCORD.WRONG_GUILD));
  }

  try {
    switch (interaction.type) {
      case InteractionType.APPLICATION_COMMAND:
        return Response.json(await dispatchCommand(interaction));
      case InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE:
        return Response.json(await handleAutocomplete(interaction));
      case InteractionType.MESSAGE_COMPONENT:
        return Response.json(await dispatchComponent(interaction));
      default:
        return Response.json(ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR));
    }
  } catch (err) {
    // Never log the raw payload.
    console.error("discord interaction failed", err);
    return Response.json(ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR));
  }
}

async function dispatchCommand(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  switch (interaction.data?.name) {
    case "verbinden":
      return handleVerbinden(interaction);
    case "trennen":
      return handleTrennen(interaction);
    case "buchen":
      return handleBuchen(interaction);
    case "tische":
      return handleTische(interaction);
    case "buchungen":
      return handleBuchungen(interaction);
    case "absagen":
      return handleAbsagen(interaction);
    case "spielersuche":
      return handleSpielersuche(interaction);
    case "event":
      return handleEvent(interaction);
    case "getraenk":
      return handleGetraenk(interaction);
    default:
      return ephemeralMessage(MESSAGES.DISCORD.UNKNOWN_COMMAND);
  }
}

async function dispatchComponent(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const id = interaction.data?.custom_id ?? "";

  if (id.startsWith("buchen_tisch:")) return handleBuchenTableSelect(interaction);
  if (id.startsWith("buchen_member:")) return handleBuchenMemberSelect(interaction);
  if (id.startsWith("buchen_confirm:")) return handleBuchenConfirm(interaction);

  if (id === "absagen_pick") return handleAbsagenPick(interaction);
  if (id.startsWith("absagen_confirm:")) return handleAbsagenConfirm(interaction);

  if (id === "ss_close_pick") return handleSpielersucheCloseSelect(interaction);
  if (id.startsWith("ss_close_confirm:")) return handleSpielersucheCloseConfirm(interaction);
  if (id === "ss_accept_pick") return handleSpielersucheAcceptSelect(interaction);
  if (id === "ss_decline_pick") return handleSpielersucheDeclineSelect(interaction);

  if (id === "event_delete_pick") return handleEventDeleteSelect(interaction);
  if (id.startsWith("event_delete_confirm:")) return handleEventDeleteConfirm(interaction);
  if (id === "event_join_pick") return handleEventJoinSelect(interaction);
  if (id === "event_leave_pick") return handleEventLeaveSelect(interaction);

  return ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR);
}
