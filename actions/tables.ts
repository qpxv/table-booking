"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { tableSchema, type TableInput } from "@/lib/schemas/table";

async function requireAdmin() {
  const session = await getSession();
  if (!isAdmin(session)) {
    throw new Error("Nicht berechtigt.");
  }
  return session;
}

export type TableFormState = { error?: string; ok?: boolean };

export async function createTable(values: TableInput): Promise<TableFormState> {
  try {
    await requireAdmin();
    const data = tableSchema.parse(values);

    await prisma.table.create({ data });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function updateTable(id: string, values: TableInput): Promise<TableFormState> {
  try {
    await requireAdmin();
    const data = tableSchema.parse(values);

    await prisma.table.update({ where: { id }, data });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function setTableActive(id: string, active: boolean) {
  await requireAdmin();

  await prisma.table.update({ where: { id }, data: { active } });
  revalidatePath("/admin/tische");
  revalidatePath("/tische");
}

export async function deleteTable(id: string) {
  await requireAdmin();

  await prisma.table.delete({ where: { id } });
  revalidatePath("/admin/tische");
  revalidatePath("/tische");
}

export async function listTables() {
  return prisma.table.findMany({ orderBy: { name: "asc" } });
}
