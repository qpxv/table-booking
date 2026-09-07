import "server-only";

/**
 * Announcement categories, each routed to its own Discord channel. App
 * updates go to a dedicated channel; the rest move to their own channels
 * over time and stay silent until the matching env var is set.
 */
export type DiscordAnnounceCategory = "appUpdate" | "booking" | "event" | "playerSearch";

const ANNOUNCE_CHANNEL_ENV: Record<DiscordAnnounceCategory, string> = {
  appUpdate: "DISCORD_APP_UPDATE_CHANNEL_ID",
  booking: "DISCORD_BOOKING_CHANNEL_ID",
  event: "DISCORD_EVENT_CHANNEL_ID",
  playerSearch: "DISCORD_PLAYER_SEARCH_CHANNEL_ID",
};

/**
 * Central, lazy accessor for the Discord secrets. Throwing here (rather than
 * at module load) keeps an unrelated import from crashing when the vars are
 * absent, and keeps `process.env.DISCORD_*` out of every handler.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export const discordEnv = {
  get appId(): string {
    return required("DISCORD_APP_ID");
  },
  get publicKey(): string {
    return required("DISCORD_PUBLIC_KEY");
  },
  get botToken(): string {
    return required("DISCORD_BOT_TOKEN");
  },
  get guildId(): string {
    return required("DISCORD_GUILD_ID");
  },
  /**
   * Channel for a given announcement category. Optional: unset means
   * announcements of that category are silently skipped.
   */
  announceChannelId(category: DiscordAnnounceCategory): string | null {
    return process.env[ANNOUNCE_CHANNEL_ENV[category]] || null;
  },
  get appBaseUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
};
