import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { listGuestHistory } from "@/lib/queries/guest-history";
import GuestHistoryTable from "@/components/guest-history/GuestHistoryTable";

export default async function GuestHistoryContent(): Promise<JSX.Element> {
  const session = await checkSession();

  const result = await listGuestHistory();
  if (!result.success) throw new Error(result.message);
  const rows = result.rows;
  const admin = isAdmin(session);

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {admin
          ? "Alle Gastbesuche und offenen Zahlungen."
          : "Deine mitgebrachten Gäste und offenen Zahlungen."}
      </p>
      <GuestHistoryTable rows={rows} isAdmin={admin} currentUserId={session.user.id} />
    </>
  );
}
