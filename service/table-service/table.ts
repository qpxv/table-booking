"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { tableSchema, type TableInput } from "@/lib/schemas/table";
import type { ServiceResult } from "@/lib/service-types";

/** Returns a ServiceResult failure if the session isn't an admin, otherwise null. */
async function requireAdmin(): Promise<ServiceResult | null> {
  const session = await getSession();
  if (!isAdmin(session)) {
    return { success: false, message: "Nicht berechtigt." };
  }
  return null;
}

export async function createTable(values: TableInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = tableSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await prisma.table.create({ data: parsed.data });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { success: true, message: "Tisch erstellt." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createTable", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function updateTable(id: string, values: TableInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = tableSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await prisma.table.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { success: true, message: "Tisch aktualisiert." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateTable", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function setTableActive(id: string, active: boolean): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.table.update({ where: { id }, data: { active } });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { success: true, message: active ? "Tisch aktiviert." : "Tisch deaktiviert." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in setTableActive", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function setTableAllowMultipleBookings(
  id: string,
  allowMultipleBookings: boolean,
): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.table.update({ where: { id }, data: { allowMultipleBookings } });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return {
      success: true,
      message: allowMultipleBookings ? "Mehrfachbuchung aktiviert." : "Mehrfachbuchung deaktiviert.",
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in setTableAllowMultipleBookings", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function deleteTable(id: string): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.table.delete({ where: { id } });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { success: true, message: "Tisch gelöscht." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteTable", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}
