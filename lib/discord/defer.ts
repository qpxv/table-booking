import "server-only";
import { after } from "next/server";
import { MESSAGES } from "@/lib/constants";
import { getActorForInteraction } from "./actor";
import { editInteractionResponse } from "./rest";
import { deferredComponentUpdate } from "./responses";
import type { Actor } from "@/lib/actor";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

/**
 * Ack a component interaction immediately, then (off the response path)
 * resolve the actor, run `action`, and replace the message with its result
 * message. Used by every "select / confirm -> service call" component flow.
 */
export function deferActInto(
  interaction: DiscordInteraction,
  action: (actor: Actor) => Promise<{ message: string }>,
): InteractionResponse {
  const token = interaction.token;
  after(async () => {
    try {
      const resolution = await getActorForInteraction(interaction);
      if (!resolution.ok) {
        await editInteractionResponse(token, { content: resolution.error, components: [] });
        return;
      }
      const result = await action(resolution.actor);
      await editInteractionResponse(token, { content: result.message, components: [] });
    } catch (err) {
      console.error("discord component action failed", err);
      await editInteractionResponse(token, {
        content: MESSAGES.DISCORD.GENERIC_ERROR,
        components: [],
      });
    }
  });
  return deferredComponentUpdate();
}
