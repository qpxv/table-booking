import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";

// Authoritative (not just optimistic) authorization check — proxy.ts only
// checks the role optimistically from the cookie; here it's verified
// against the real session.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  return children;
}
