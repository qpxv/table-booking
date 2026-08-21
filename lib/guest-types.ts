export type GuestWithVisits = {
  id: string;
  name: string;
  visitCount: number;
  hasVisitedBefore: boolean;
};

export type MemberGuestSummary = {
  id: string;
  name: string;
  visitCount: number;
  isFirstTimer: boolean;
};

export type GuestsByMember = {
  [memberId: string]: MemberGuestSummary[];
};
