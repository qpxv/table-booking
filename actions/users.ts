"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import {
  createUserSchema,
  updateUserSchema,
  roleSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/schemas/user";

async function requireAdminHeaders() {
  const session = await getSession();
  if (!isAdmin(session)) {
    throw new Error("Nicht berechtigt.");
  }
  return headers();
}

export type UserFormState = { error?: string; ok?: boolean };

export async function createUser(values: CreateUserInput): Promise<UserFormState> {
  try {
    const requestHeaders = await requireAdminHeaders();
    const data = createUserSchema.parse(values);

    await auth.api.createUser({
      body: data,
      headers: requestHeaders,
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function updateUser(
  userId: string,
  values: UpdateUserInput,
): Promise<UserFormState> {
  try {
    const requestHeaders = await requireAdminHeaders();
    const data = updateUserSchema.parse(values);

    await auth.api.adminUpdateUser({
      body: { userId, data: { name: data.name } },
      headers: requestHeaders,
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function updateUserRole(userId: string, role: string): Promise<UserFormState> {
  try {
    const requestHeaders = await requireAdminHeaders();
    const parsedRole = roleSchema.parse(role);

    await auth.api.setRole({
      body: { userId, role: parsedRole },
      headers: requestHeaders,
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function deleteUser(userId: string): Promise<UserFormState> {
  try {
    const requestHeaders = await requireAdminHeaders();

    await auth.api.removeUser({
      body: { userId },
      headers: requestHeaders,
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function listUsers() {
  const requestHeaders = await requireAdminHeaders();

  const result = await auth.api.listUsers({
    query: { sortBy: "name", sortDirection: "asc", limit: 200 },
    headers: requestHeaders,
  });

  return result.users;
}
