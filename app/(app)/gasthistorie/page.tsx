import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { listGuestHistory } from "@/actions/guestHistory";
import GuestHistoryTable from "@/components/guest-history/GuestHistoryTable";

export default async function GuestHistoryPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const rows = await listGuestHistory();
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
