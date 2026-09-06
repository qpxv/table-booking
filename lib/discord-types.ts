// Narrow shapes for the parts of a Discord interaction payload this app
// actually reads. The full payload is much larger (see
// https://discord.com/developers/docs/interactions/receiving-and-responding);
// everything here is deliberately partial and treated as untrusted input.

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
}

export interface DiscordInteractionMember {
  user: DiscordUser;
}

export interface DiscordCommandOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  options?: DiscordCommandOption[];
  focused?: boolean;
}

export interface DiscordInteractionData {
  id?: string;
  name?: string;
  type?: number;
  options?: DiscordCommandOption[];
  custom_id?: string;
  component_type?: number;
  values?: string[];
  resolved?: {
    users?: Record<string, DiscordUser>;
  };
}

export interface DiscordInteraction {
  id: string;
  application_id: string;
  type: number;
  token: string;
  guild_id?: string;
  channel_id?: string;
  member?: DiscordInteractionMember;
  user?: DiscordUser;
  data?: DiscordInteractionData;
}

/** The JSON body of an interaction response (or a deferred ack). */
export type InteractionResponse = Record<string, unknown>;
