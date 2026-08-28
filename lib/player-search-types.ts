/** Compact label for the auto-created booking's `game` field, e.g. "40k FunSpiel". */
export function playerSearchBookingLabel(system: string, matchType: string): string {
  return `${system} ${matchType}`;
}
