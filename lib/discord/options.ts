import { CommandOptionType } from "./interactions";
import type {
  DiscordCommandOption,
  DiscordInteractionData,
} from "@/lib/discord-types";

export interface Subcommand {
  name: string;
  options: DiscordCommandOption[];
}

/** The invoked subcommand (e.g. `/spielersuche open`) and its own options. */
export function getSubcommand(data: DiscordInteractionData): Subcommand | null {
  const sub = data.options?.find((o) => o.type === CommandOptionType.SUB_COMMAND);
  if (!sub) return null;
  return { name: sub.name, options: sub.options ?? [] };
}

export function getStringOption(
  options: DiscordCommandOption[],
  name: string,
): string | null {
  const opt = options.find((o) => o.name === name);
  return typeof opt?.value === "string" ? opt.value : null;
}

export function getIntegerOption(
  options: DiscordCommandOption[],
  name: string,
): number | null {
  const opt = options.find((o) => o.name === name);
  return typeof opt?.value === "number" ? opt.value : null;
}

/** The option the user is currently typing (autocomplete interactions). */
export function getFocusedOption(
  options: DiscordCommandOption[],
): DiscordCommandOption | null {
  return options.find((o) => o.focused) ?? null;
}
