import { listUsers } from "@/actions/users";
import { listGuestsGroupedByBringer } from "@/actions/guests";
import UserManager from "@/components/users/UserManager";

export default async function AdminUsersPage() {
  const [users, guestsByMember] = await Promise.all([
    listUsers(),
    listGuestsGroupedByBringer(),
  ]);
  const usersWithGuests = users.map((user) => ({
    ...user,
    guests: guestsByMember[user.id] ?? [],
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
