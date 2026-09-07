import "server-only";
import { after } from "next/server";
import { discordEnv, type DiscordAnnounceCategory } from "./env";
import { postToChannel } from "./rest";

/**
 * Post a line to the Discord channel for the given announcement `category`,
 * fire-and-forget. Runs off the response path, never throws, and is a no-op
 * when that category's channel env var is unset. Called next to the existing
 * `notify()` calls in the service layer so web- and Discord-triggered
 * actions both announce.
 */
export function announce(content: string, category: DiscordAnnounceCategory): void {
  const channelId = discordEnv.announceChannelId(category);
  if (!channelId) return;
  after(() =>
    postToChannel(channelId, content).catch((err) =>
      console.error("discord announce failed", err),
    ),
  );
}
