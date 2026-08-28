"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { tableSchema, type TableFormInput } from "@/lib/schemas/table";
import type { ServiceResult } from "@/lib/service-types";

export async function createTable(values: TableFormInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = tableSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await prisma.table.create({ data: parsed.data });
    revalidatePath(ROUTES.ADMIN_TISCHE);
    revalidatePath(ROUTES.TISCHE);
    return { success: true, message: MESSAGES.TABLE.CREATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createTable", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function updateTable(id: string, values: TableFormInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = tableSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await prisma.table.update({ where: { id }, data: parsed.data });
    revalidatePath(ROUTES.ADMIN_TISCHE);
    revalidatePath(ROUTES.TISCHE);
    return { success: true, message: MESSAGES.TABLE.UPDATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateTable", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function setTableActive(id: string, active: boolean): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.table.update({ where: { id }, data: { active } });
    revalidatePath(ROUTES.ADMIN_TISCHE);
    revalidatePath(ROUTES.TISCHE);
    return { success: true, message: active ? MESSAGES.TABLE.ACTIVATED : MESSAGES.TABLE.DEACTIVATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in setTableActive", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
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
    revalidatePath(ROUTES.ADMIN_TISCHE);
    revalidatePath(ROUTES.TISCHE);
    return {
      success: true,
      message: allowMultipleBookings ? MESSAGES.TABLE.MULTIPLE_ENABLED : MESSAGES.TABLE.MULTIPLE_DISABLED,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in setTableAllowMultipleBookings", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function deleteTable(id: string): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.table.delete({ where: { id } });
    revalidatePath(ROUTES.ADMIN_TISCHE);
    revalidatePath(ROUTES.TISCHE);
    return { success: true, message: MESSAGES.TABLE.DELETED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteTable", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
