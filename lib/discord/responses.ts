import {
  InteractionResponseType,
  InteractionResponseFlags,
} from "./interactions";
import type { InteractionResponse } from "@/lib/discord-types";

const EPHEMERAL = InteractionResponseFlags.EPHEMERAL;

export function pong(): InteractionResponse {
  return { type: InteractionResponseType.PONG };
}

/** A visible-only-to-the-invoker message reply. */
export function ephemeralMessage(
  content: string,
  components?: unknown[],
): InteractionResponse {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: EPHEMERAL,
      ...(components ? { components } : {}),
    },
  };
}

/** Immediate ack for a command that needs longer than 3s; follow up via REST. */
export function deferredEphemeral(): InteractionResponse {
  return {
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: { flags: EPHEMERAL },
  };
}

/** Immediate ack for a component click; edit the message later via REST. */
export function deferredComponentUpdate(): InteractionResponse {
  return { type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE };
}

/** Replace the message a component was attached to (drops its components by default). */
export function updateMessage(
  content: string,
  components: unknown[] = [],
): InteractionResponse {
  return {
    type: InteractionResponseType.UPDATE_MESSAGE,
    data: { content, components },
  };
}

export function autocompleteResult(
  choices: { name: string; value: string }[],
): InteractionResponse {
  return {
    type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: { choices: choices.slice(0, 25) },
  };
}
