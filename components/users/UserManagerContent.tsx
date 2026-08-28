import type { JSX } from "react";
import { listUsers } from "@/lib/queries/users";
import { listGuestsGroupedByBringer } from "@/lib/queries/guests";
import UserManager from "@/components/users/UserManager";

export default async function UserManagerContent(): Promise<JSX.Element> {
  const [usersResult, guestsByMemberResult] = await Promise.all([
    listUsers(),
    listGuestsGroupedByBringer(),
  ]);

  if (!usersResult.success) throw new Error(usersResult.message);
  if (!guestsByMemberResult.success) throw new Error(guestsByMemberResult.message);

  const usersWithGuests = usersResult.users.map((user) => ({
    ...user,
    guests: guestsByMemberResult.guestsByMember[user.id] ?? [],
  }));

  return <UserManager users={usersWithGuests} />;
}
