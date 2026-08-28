"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isHiddenAccount } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import {
  createUserSchema,
  updateUserSchema,
  roleSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ResetPasswordInput,
} from "@/lib/schemas/user";
import { notify } from "@/lib/push/notify";
import type { ServiceResult } from "@/lib/service-types";

/** Returns request headers if the session is an admin, otherwise a ServiceResult failure. */
async function requireAdminHeaders(): Promise<
  { headers: Headers; authError?: undefined } | { headers?: undefined; authError: ServiceResult }
> {
  const authError = await requireAdmin();
  if (authError) return { authError };
  return { headers: await headers() };
}

export async function createUser(values: CreateUserInput): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    const created = await auth.api.createUser({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        data: { memberId: parsed.data.memberId },
      },
      headers: admin.headers,
    });

    // The admin picked this password, so force the member to replace it on
    // first login. Written here rather than through `data` above because the
    // field is `input: false` in the auth config.
    // No push notification here: the member has no device subscribed yet, and
    // the admin-set password is communicated out of band anyway.
    await prisma.user.update({
      where: { id: created.user.id },
      data: { mustChangePassword: true },
    });

    revalidatePath(ROUTES.ADMIN_USERS);
    return { success: true, message: MESSAGES.USER.CREATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createUser", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function updateUser(userId: string, values: UpdateUserInput): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await auth.api.adminUpdateUser({
      body: {
        userId,
        data: { name: parsed.data.name, email: parsed.data.email, memberId: parsed.data.memberId },
      },
      headers: admin.headers,
    });

    revalidatePath(ROUTES.ADMIN_USERS);
    return { success: true, message: MESSAGES.USER.UPDATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateUser", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function updateUserRole(userId: string, role: string): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const parsedRole = roleSchema.safeParse(role);
  if (!parsedRole.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await auth.api.setRole({
      body: { userId, role: parsedRole.data },
      headers: admin.headers,
    });

    revalidatePath(ROUTES.ADMIN_USERS);
    return { success: true, message: MESSAGES.USER.ROLE_UPDATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateUserRole", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function resetUserPassword(
  userId: string,
  values: ResetPasswordInput,
): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await auth.api.setUserPassword({
      body: { userId, newPassword: parsed.data.newPassword },
      headers: admin.headers,
    });

    // Same as account creation: an admin-chosen password must be replaced by
    // the member before they can use the app again. This also stops an admin
    // from setting a password and quietly using the account themselves.
    await prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: true },
    });

    notify(
      [userId],
      MESSAGES.NOTIFICATIONS.passwordReset(),
      ROUTES.DASHBOARD,
      `password-reset-${userId}`,
    );
    revalidatePath(ROUTES.ADMIN_USERS);
    return { success: true, message: MESSAGES.USER.PASSWORD_RESET };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in resetUserPassword", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function deleteUser(userId: string): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (target && isHiddenAccount(target.email)) {
    return { success: false, message: MESSAGES.USER.CANNOT_DELETE_HIDDEN };
  }

  try {
    await auth.api.removeUser({
      body: { userId },
      headers: admin.headers,
    });

    revalidatePath(ROUTES.ADMIN_USERS);
    return { success: true, message: MESSAGES.USER.DELETED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteUser", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
