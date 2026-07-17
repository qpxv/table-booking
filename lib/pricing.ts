export const GUEST_PRICE_RETURNING = 5;
export const GUEST_PRICE_FIRST_VISIT = 0;

export function calculateGuestPrice(previousVisitCount: number): number {
  return previousVisitCount === 0 ? GUEST_PRICE_FIRST_VISIT : GUEST_PRICE_RETURNING;
}
