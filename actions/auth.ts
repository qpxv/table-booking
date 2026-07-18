"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SignInInput } from "@/lib/schemas/auth";
import type { ActionResult } from "@/types/action-result";

export async function signIn(values: SignInInput): Promise<ActionResult> {
  try {
    await auth.api.signInEmail({ body: values });
  } catch (err) {
    console.error("error in signIn", err);
    return { success: false, message: "Anmeldung fehlgeschlagen." };
  }

  redirect("/dashboard");
}
