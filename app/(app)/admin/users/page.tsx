import { Suspense, type JSX } from "react";
import UserManagerContent from "@/components/users/UserManagerContent";
import ManagerTableSkeleton from "@/components/shared/ManagerTableSkeleton";

export default function AdminUsersPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Benutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Mitglieder verwalten, Rollen und Zugangsdaten anpassen.
        </p>
      </div>
      <Suspense fallback={<ManagerTableSkeleton columns={5} />}>
        <UserManagerContent />
      </Suspense>
    </div>
  );
}
