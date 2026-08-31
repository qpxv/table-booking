/** Compact label for the auto-created booking's `game` field, e.g. "40k FunSpiel". */
export function playerSearchBookingLabel(system: string, matchType: string): string {
  return `${system} ${matchType}`;
}

/** A Spielersuche with no fixed window: the interested member proposes a time. */
export function isFlexibleSearch(start: Date | null): boolean {
  return start === null;
}

/**
 * Whose turn it is in an interest's time negotiation. The party who did NOT
 * make the standing proposal is on the clock (accept / decline / counter);
 * the last proposer just waits.
 */
export function isAwaiting(
  userId: string,
  proposedById: string,
  creatorId: string,
  responderId: string,
): boolean {
  if (userId !== creatorId && userId !== responderId) return false;
  return userId !== proposedById;
}
