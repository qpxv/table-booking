import type { MemberGuestSummary } from "@/lib/guest-types";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  memberId?: string | null;
  role?: string | string[] | null;
  guests?: MemberGuestSummary[];
};

export type MemberOption = {
  id: string;
  name: string;
};
