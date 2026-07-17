"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SignInInput } from "@/lib/schemas/auth";

export type SignInState = { error?: string };

export async function signIn(values: SignInInput): Promise<SignInState> {
  try {
    await auth.api.signInEmail({ body: values });
  } catch {
    return { error: "Anmeldung fehlgeschlagen." };
  }

  redirect("/dashboard");
}
