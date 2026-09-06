import "server-only";

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
  /** Optional: unset means channel announcements are silently skipped. */
  get announceChannelId(): string | null {
    return process.env.DISCORD_ANNOUNCE_CHANNEL_ID || null;
  },
  get appBaseUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
};
