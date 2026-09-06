import "server-only";
import { listGames } from "@/lib/queries/games";
import { autocompleteResult } from "../responses";
import { getSubcommand, getFocusedOption } from "../options";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

// Both `/buchen spiel:` and `/spielersuche open system:` autocomplete from the
// admin-managed game list.
const GAME_OPTION_NAMES = new Set(["spiel", "system"]);

export async function handleAutocomplete(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const data = interaction.data;
  if (!data) return autocompleteResult([]);

  const sub = getSubcommand(data);
  const options = sub ? sub.options : data.options ?? [];
  const focused = getFocusedOption(options);
  if (!focused || !GAME_OPTION_NAMES.has(focused.name)) {
    return autocompleteResult([]);
  }

  const typed =
    typeof focused.value === "string" ? focused.value.toLowerCase() : "";
  const { games } = await listGames();
  return autocompleteResult(
    games
      .filter((g) => g.name.toLowerCase().includes(typed))
      .map((g) => ({ name: g.name, value: g.name })),
  );
}
