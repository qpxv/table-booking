import "server-only";
import { after } from "next/server";
import { discordEnv } from "./env";
import { postToChannel } from "./rest";

/**
 * Post a line to the club's Discord announce channel, fire-and-forget. Runs
 * off the response path, never throws, and is a no-op when
 * DISCORD_ANNOUNCE_CHANNEL_ID is unset. Called next to the existing `notify()`
 * calls in the service layer so web- and Discord-triggered actions both
 * announce.
 */
export function announce(content: string): void {
  const channelId = discordEnv.announceChannelId;
  if (!channelId) return;
  after(() =>
    postToChannel(channelId, content).catch((err) =>
      console.error("discord announce failed", err),
    ),
  );
}
