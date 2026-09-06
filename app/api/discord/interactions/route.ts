import { InteractionType } from "discord-interactions";
import { MESSAGES } from "@/lib/constants";
import { verifyDiscordRequest } from "@/lib/discord/verify";
import { discordEnv } from "@/lib/discord/env";
import { pong, ephemeralMessage } from "@/lib/discord/responses";
import { handleVerbinden } from "@/lib/discord/handlers/verbinden";
import { handleTrennen } from "@/lib/discord/handlers/trennen";
import type { DiscordInteraction } from "@/lib/discord-types";

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

  // Endpoint validation handshake.
  if (interaction.type === InteractionType.PING) {
    return Response.json(pong());
  }

  // Guild-install only: no DMs, no other servers.
  if (interaction.guild_id !== discordEnv.guildId) {
    return Response.json(ephemeralMessage(MESSAGES.DISCORD.WRONG_GUILD));
  }

  try {
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      return await dispatchCommand(interaction);
    }
    return Response.json(ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR));
  } catch (err) {
    // Never log the raw payload.
    console.error("discord interaction failed", err);
    return Response.json(ephemeralMessage(MESSAGES.DISCORD.GENERIC_ERROR));
  }
}

async function dispatchCommand(interaction: DiscordInteraction): Promise<Response> {
  switch (interaction.data?.name) {
    case "verbinden":
      return Response.json(await handleVerbinden(interaction));
    case "trennen":
      return Response.json(await handleTrennen(interaction));
    default:
      return Response.json(ephemeralMessage(MESSAGES.DISCORD.UNKNOWN_COMMAND));
  }
}
