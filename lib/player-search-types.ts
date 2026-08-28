export const MATCH_TYPE_VALUES = ["fun", "tournament"] as const;

export type MatchType = (typeof MATCH_TYPE_VALUES)[number];

export const MATCH_TYPE_OPTIONS: { value: MatchType; label: string }[] = [
  { value: "fun", label: "FunSpiel" },
  { value: "tournament", label: "Turnier" },
];

export function matchTypeLabel(value: string): string {
  return MATCH_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/** Compact label for the auto-created booking's `game` field, e.g. "40k FunSpiel". */
export function playerSearchBookingLabel(system: string, matchType: string): string {
  return `${system} ${matchTypeLabel(matchType)}`;
}
