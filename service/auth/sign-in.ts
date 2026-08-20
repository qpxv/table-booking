"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SignInInput } from "@/lib/schemas/auth";
import type { ServiceResult } from "@/lib/service-types";

export async function signIn(values: SignInInput): Promise<ServiceResult> {
  try {
    await auth.api.signInEmail({ body: values });
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in signIn", err);
    return { success: false, message: "Anmeldung fehlgeschlagen." };
  }

  redirect("/dashboard");
}
