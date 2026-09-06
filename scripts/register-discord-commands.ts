// Registers the guild-scoped slash commands with Discord. Guild-scoped
// commands propagate instantly (global ones take up to 1h), which is what we
// want for a single club server.
//
//   npm run discord:register
//
// Needs DISCORD_APP_ID / DISCORD_GUILD_ID / DISCORD_BOT_TOKEN in .env. Run
// locally or in CI only; never imported by app code.

import "dotenv/config";
import { ALL_COMMANDS } from "../lib/discord/commands";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const appId = required("DISCORD_APP_ID");
  const guildId = required("DISCORD_GUILD_ID");
  const botToken = required("DISCORD_BOT_TOKEN");

  const res = await fetch(
    `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ALL_COMMANDS),
    },
  );

  if (!res.ok) {
    console.error(`registration failed: ${res.status}`);
    console.error(await res.text());
    process.exit(1);
  }

  const registered = (await res.json()) as { name: string }[];
  console.log(`registered ${registered.length} command(s):`);
  for (const cmd of registered) console.log(`  /${cmd.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
