"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type SignInState = { error?: string };

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? ""); // review: cant we couple RHF here too so that we get objects here alerady and dont need to do this weird formdata get? apply to all useactionstate things
  const password = String(formData.get("password") ?? "");

  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch {
    return { error: "Anmeldung fehlgeschlagen." };
  }

  redirect("/dashboard");
}
