import { listUsers } from "@/actions/users";
import UserManager from "@/components/users/UserManager";

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Benutzerverwaltung</h1>
      <UserManager users={users} />
    </div>
  );
}
