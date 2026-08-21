import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Fetches the session, redirecting to the login page if there isn't one. */
export async function checkSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.LOGIN);
  }
  return session;
}
