"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MESSAGES, ROUTES } from "@/lib/constants";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/user";
import type { ServiceResult } from "@/lib/service-types";

/**
 * Sets the current member's password and clears their forced-change flag.
 *
 * Deliberately does NOT ask for the current password: it's only callable
 * while `mustChangePassword` is set, i.e. right after an admin provisioned
 * the account or reset its password, when the "current" password is one the
 * member never chose. The active session is proof of identity.
 */
export async function completeForcedPasswordChange(
  values: ResetPasswordInput,
): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  if (!(session.user as { mustChangePassword?: boolean }).mustChangePassword) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(parsed.data.newPassword);
    await ctx.internalAdapter.updatePassword(session.user.id, hashedPassword);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { mustChangePassword: false },
    });

    revalidatePath(ROUTES.HOME, "layout");
    return { success: true, message: MESSAGES.SETTINGS.PASSWORD_CHANGED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in completeForcedPasswordChange", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
