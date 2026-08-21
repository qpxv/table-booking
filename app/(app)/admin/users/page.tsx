import type { JSX } from "react";
import { listUsers } from "@/lib/queries/users";
import { listGuestsGroupedByBringer } from "@/lib/queries/guests";
import UserManager from "@/components/users/UserManager";

export default async function AdminUsersPage(): Promise<JSX.Element> {
  const usersResult = await listUsers();
  if (!usersResult.success) throw new Error(usersResult.message);

  const guestsByMemberResult = await listGuestsGroupedByBringer();
  if (!guestsByMemberResult.success) throw new Error(guestsByMemberResult.message);

  const usersWithGuests = usersResult.users.map((user) => ({
    ...user,
    guests: guestsByMemberResult.guestsByMember[user.id] ?? [],
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Benutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Mitglieder verwalten, Rollen und Zugangsdaten anpassen.
        </p>
      </div>
      <UserManager users={usersWithGuests} />
    </div>
  );
}
