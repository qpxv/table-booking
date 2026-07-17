"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";

const tableSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  active: z.coerce.boolean(),
});

async function requireAdmin() {
  const session = await getSession();
  if (!isAdmin(session)) {
    throw new Error("Nicht berechtigt.");
  }
  return session;
}

export type TableFormState = { error?: string; ok?: boolean };

function parseTableForm(formData: FormData) {
  return tableSchema.parse({
    name: formData.get("name"),
    active: formData.get("active") === "on",
  });
}

export async function createTable(
  _prevState: TableFormState,
  formData: FormData,
): Promise<TableFormState> {
  try {
    await requireAdmin();
    const data = parseTableForm(formData);

    await prisma.table.create({ data });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function updateTable(
  id: string,
  _prevState: TableFormState,
  formData: FormData,
): Promise<TableFormState> {
  try {
    await requireAdmin();
    const data = parseTableForm(formData);

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
