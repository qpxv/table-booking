import "server-only";
import { verifyKey } from "discord-interactions";
import { discordEnv } from "./env";

/**
 * Ed25519 signature check against the raw request body. Every interaction
 * request carries `X-Signature-Ed25519` / `X-Signature-Timestamp`; a request
 * that fails this must be rejected with 401.
 */
export async function verifyDiscordRequest(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): Promise<boolean> {
  if (!signature || !timestamp) return false;
  try {
    return await verifyKey(rawBody, signature, timestamp, discordEnv.publicKey);
  } catch {
    return false;
  }
}
