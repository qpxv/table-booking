// Post the newest CHANGELOG.md entry into the club's Discord app-update
// channel. CHANGELOG.md only ever holds the latest release (see
// scripts/changelog.mjs), so the whole file is the message.
//
//   npm run changelog                 # generate + write CHANGELOG.md, then commit it
//   npm run changelog:post            # post it to Discord
//   npm run changelog:post -- --dry-run   # print the chunks, post nothing
//
// Needs DISCORD_BOT_TOKEN and DISCORD_APP_UPDATE_CHANNEL_ID in .env. If
// DISCORD_MITGLIED_ROLE_ID is set, the first message pings that role under
// the "# App-Update" title. Run
// locally or in CI only; never imported by app code. Deliberately does its
// own Discord fetch (like scripts/register-discord-commands.ts): lib/discord
// is server-only and can't be imported here.

import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const DISCORD_LIMIT = 2000;
const CHUNK_TARGET = 1900; // headroom for a re-opened ``` fence
const FENCE_REOPEN = "```diff";

const dryRun = process.argv.slice(2).includes("--dry-run");

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set`);
    process.exit(1);
  }
  return value;
}

function hardWrap(line: string): string[] {
  if (line.length <= CHUNK_TARGET) return [line];
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += CHUNK_TARGET) {
    parts.push(line.slice(i, i + CHUNK_TARGET));
  }
  return parts;
}

/**
 * Split markdown into Discord-sized messages: pack lines greedily, prefer to
 * break on "## " section headings, and keep ``` code fences balanced by
 * closing them at a flush and re-opening them on the next chunk.
 */
function splitForDiscord(markdown: string): string[] {
  const chunks: string[] = [];
  let current = "";
  let inFence = false;
  let reopenFence = false;

  const flush = (): void => {
    if (!current.trim()) {
      current = "";
      return;
    }
    let out = current.replace(/\n+$/, "");
    if (inFence) out += "\n```";
    chunks.push(out);
    reopenFence = inFence;
    current = "";
  };

  const startChunk = (): void => {
    current = reopenFence ? `${FENCE_REOPEN}\n` : "";
    reopenFence = false;
  };

  const lines = markdown.replace(/\n+$/, "").split("\n");
  for (const raw of lines) {
    for (const line of hardWrap(raw)) {
      const isSectionHeading = /^## /.test(line);
      if (isSectionHeading && current.trim().length > 200 && !inFence) {
        flush();
      }
      if (current === "" && reopenFence) startChunk();

      if (current.length + line.length + 1 > CHUNK_TARGET && current.trim()) {
        flush();
        startChunk();
      }

      current += `${line}\n`;
      if (/^```/.test(line)) inFence = !inFence;
    }
  }
  flush();

  return chunks.filter((chunk) => chunk.trim().length > 0 && chunk.length <= DISCORD_LIMIT);
}

async function postChunk(
  channelId: string,
  botToken: string,
  content: string,
  roleId: string | null,
): Promise<void> {
  const allowed_mentions = roleId ? { roles: [roleId] } : { parse: [] as const };
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, allowed_mentions }),
  });
  if (!res.ok) {
    console.error(`discord post failed: ${res.status}`);
    console.error(await res.text());
    process.exit(1);
  }
}

async function main(): Promise<void> {
  if (!existsSync(CHANGELOG)) {
    console.error("CHANGELOG.md not found. Run `npm run changelog` first.");
    process.exit(1);
  }
  let entry = readFileSync(CHANGELOG, "utf8").trim();
  if (!entry) {
    console.error("CHANGELOG.md is empty.");
    process.exit(1);
  }

  const roleId = process.env.DISCORD_MITGLIED_ROLE_ID || null;
  if (roleId) {
    const mention = `<@&${roleId}>`;
    entry = /^# /m.test(entry)
      ? entry.replace(/^(# .*)$/m, `$1\n${mention}`)
      : `${mention}\n\n${entry}`;
  }

  const chunks = splitForDiscord(entry);
  if (chunks.length === 0) {
    console.error("Nothing to post after splitting CHANGELOG.md.");
    process.exit(1);
  }

  if (dryRun) {
    chunks.forEach((chunk, i) => {
      console.log(`\n----- message ${i + 1}/${chunks.length} (${chunk.length} chars) -----`);
      console.log(chunk);
    });
    return;
  }

  const botToken = required("DISCORD_BOT_TOKEN");
  const channelId = required("DISCORD_APP_UPDATE_CHANNEL_ID");

  for (let i = 0; i < chunks.length; i++) {
    await postChunk(channelId, botToken, chunks[i], chunks[i].includes("<@&") ? roleId : null);
    console.log(`posted message ${i + 1}/${chunks.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
