"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { endOfWeekBerlin } from "@/lib/datetime";
import { BookingStatus } from "@/generated/prisma/enums";
import { tableSchema, type TableInput } from "@/lib/schemas/table";
import type { ActionResult } from "@/types/action-result";

/** Returns an ActionResult failure if the session isn't an admin, otherwise null. */
async function requireAdmin(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!isAdmin(session)) {
    return { success: false, message: "Nicht berechtigt." };
  }
  return null;
}

export async function createTable(values: TableInput): Promise<ActionResult> {
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
    console.error("error in createTable", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function updateTable(id: string, values: TableInput): Promise<ActionResult> {
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
    console.error("error in updateTable", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function setTableActive(id: string, active: boolean): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.table.update({ where: { id }, data: { active } });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { success: true, message: active ? "Tisch aktiviert." : "Tisch deaktiviert." };
  } catch (err) {
    console.error("error in setTableActive", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function deleteTable(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.table.delete({ where: { id } });
    revalidatePath("/admin/tische");
    revalidatePath("/tische");
    return { success: true, message: "Tisch gelöscht." };
  } catch (err) {
    console.error("error in deleteTable", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function listTables() {
  return prisma.table.findMany({ orderBy: { name: "asc" } });
}

/** Active tables with a count of their still-upcoming bookings through the end of this week. */
export async function listTablesWithUpcomingWeekCounts() {
  const now = new Date();
  const weekEnd = endOfWeekBerlin(now);

  const tables = await prisma.table.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          bookings: {
            where: {
              status: BookingStatus.ACTIVE,
              start: { gte: now, lte: weekEnd },
            },
          },
        },
      },
    },
  });

  return tables.map((table) => ({
    ...table,
    upcomingWeekBookingCount: table._count.bookings,
  }));
}
