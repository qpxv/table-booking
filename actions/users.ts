"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";

async function requireAdminHeaders() {
  const session = await getSession();
  if (!isAdmin(session)) {
    throw new Error("Nicht berechtigt.");
  }
  return headers();
}

const roleSchema = z.enum(["admin", "user"]);

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  email: z.email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  role: roleSchema,
});

export type UserFormState = { error?: string; ok?: boolean };

export async function createUser(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    const requestHeaders = await requireAdminHeaders();
    const data = createUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });

    await auth.api.createUser({
      body: data,
      headers: requestHeaders,
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  role: roleSchema,
});

export async function updateUser(
  userId: string,
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    const requestHeaders = await requireAdminHeaders();
    const data = updateUserSchema.parse({
      name: formData.get("name"),
      role: formData.get("role"),
    });

    await auth.api.adminUpdateUser({
      body: { userId, data: { name: data.name } },
      headers: requestHeaders,
    });
    await auth.api.setRole({
      body: { userId, role: data.role },
      headers: requestHeaders,
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function deleteUser(userId: string) {
  const requestHeaders = await requireAdminHeaders();

  await auth.api.removeUser({
    body: { userId },
    headers: requestHeaders,
  });

  revalidatePath("/admin/users");
}

export async function listUsers() {
  const requestHeaders = await requireAdminHeaders();

  const result = await auth.api.listUsers({
    query: { sortBy: "name", sortDirection: "asc", limit: 200 },
    headers: requestHeaders,
  });

  return result.users;
}
