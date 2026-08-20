"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin, isHiddenAccount } from "@/lib/permissions";
import {
  createUserSchema,
  updateUserSchema,
  roleSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ResetPasswordInput,
} from "@/lib/schemas/user";
import type { ServiceResult } from "@/lib/service-types";

/** Returns request headers if the session is an admin, otherwise a ServiceResult failure. */
async function requireAdminHeaders(): Promise<
  { headers: Headers; authError?: undefined } | { headers?: undefined; authError: ServiceResult }
> {
  const session = await getSession();
  if (!isAdmin(session)) {
    return { authError: { success: false, message: "Nicht berechtigt." } };
  }
  return { headers: await headers() };
}

export async function createUser(values: CreateUserInput): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await auth.api.createUser({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        data: { memberId: parsed.data.memberId },
      },
      headers: admin.headers,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Benutzer erstellt." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createUser", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function updateUser(userId: string, values: UpdateUserInput): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await auth.api.adminUpdateUser({
      body: {
        userId,
        data: { name: parsed.data.name, email: parsed.data.email, memberId: parsed.data.memberId },
      },
      headers: admin.headers,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Benutzer aktualisiert." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateUser", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function updateUserRole(userId: string, role: string): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const parsedRole = roleSchema.safeParse(role);
  if (!parsedRole.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await auth.api.setRole({
      body: { userId, role: parsedRole.data },
      headers: admin.headers,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Rolle aktualisiert." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateUserRole", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function resetUserPassword(
  userId: string,
  values: ResetPasswordInput,
): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await auth.api.setUserPassword({
      body: { userId, newPassword: parsed.data.newPassword },
      headers: admin.headers,
    });

    return { success: true, message: "Passwort zurückgesetzt." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in resetUserPassword", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function deleteUser(userId: string): Promise<ServiceResult> {
  const admin = await requireAdminHeaders();
  if (admin.authError) return admin.authError;

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (target && isHiddenAccount(target.email)) {
    return { success: false, message: "Dieser Benutzer kann nicht gelöscht werden." };
  }

  try {
    await auth.api.removeUser({
      body: { userId },
      headers: admin.headers,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Benutzer gelöscht." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteUser", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}
