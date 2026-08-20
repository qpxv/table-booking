import type { JSX } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { listGuestHistory } from "@/lib/queries/guest-history";
import GuestHistoryTable from "@/components/guest-history/GuestHistoryTable";

export default async function GuestHistoryPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await listGuestHistory();
  if (!result.success) throw new Error(result.message);
  const rows = result.rows;
  const admin = isAdmin(session);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Gasthistorie</h1>
        <p className="text-sm text-muted-foreground">
          {admin
            ? "Alle Gastbesuche und offenen Zahlungen."
            : "Deine mitgebrachten Gäste und offenen Zahlungen."}
        </p>
      </div>
      <GuestHistoryTable rows={rows} isAdmin={admin} currentUserId={session.user.id} />
    </div>
  );
}
