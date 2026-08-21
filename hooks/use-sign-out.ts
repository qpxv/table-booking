"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";

/** Signs out, then sends the user to the login page with fresh server data. */
export function useSignOut(): () => Promise<void> {
  const router = useRouter();

  return async function signOut(): Promise<void> {
    await authClient.signOut();
    router.push(ROUTES.LOGIN);
    router.refresh();
  };
}
