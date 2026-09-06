import "server-only";
import { discordEnv } from "./env";

const API_BASE = "https://discord.com/api/v10";

async function discordFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${discordEnv.botToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "<no body>";
  }
}

/**
 * Edit the original (typically deferred) response to an interaction. Used to
 * deliver the real result after a `deferredEphemeral()` / component ack.
 */
export async function editInteractionResponse(
  token: string,
  body: Record<string, unknown>,
): Promise<void> {
  const res = await discordFetch(
    `/webhooks/${discordEnv.appId}/${token}/messages/@original`,
    {
      method: "PATCH",
      body: JSON.stringify({ allowed_mentions: { parse: [] }, ...body }),
    },
  );
  if (!res.ok) {
    console.error("discord editInteractionResponse failed", res.status, await safeText(res));
  }
}

/** Post a plain message into a channel (used by channel announcements). */
export async function postToChannel(channelId: string, content: string): Promise<void> {
  const res = await discordFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!res.ok) {
    console.error("discord postToChannel failed", res.status, await safeText(res));
  }
}
