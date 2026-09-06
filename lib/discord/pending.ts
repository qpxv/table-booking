import "server-only";
import { prisma } from "@/lib/prisma";

const MAX_AGE_MS = 15 * 60 * 1000;

export interface BuchenPayload {
  kind: "buchen";
  startISO: string;
  endISO: string;
  game: string | null;
  guestNames: string[];
  tableId: string | null;
  memberDiscordIds: string[];
}

export type PendingPayload = BuchenPayload;

/** Best-effort cleanup of abandoned rows. Called at the start of each flow. */
export async function sweepPendingActions(): Promise<void> {
  try {
    await prisma.discordPendingAction.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - MAX_AGE_MS) } },
    });
  } catch (err) {
    console.error("discord sweepPendingActions failed", err);
  }
}

export async function createPendingAction(
  userId: string,
  payload: PendingPayload,
): Promise<string> {
  const row = await prisma.discordPendingAction.create({
    data: { kind: payload.kind, userId, payload: payload as unknown as object },
  });
  return row.id;
}

export async function getPendingAction(
  id: string,
): Promise<{ userId: string; payload: PendingPayload } | null> {
  const row = await prisma.discordPendingAction.findUnique({ where: { id } });
  if (!row) return null;
  if (row.createdAt < new Date(Date.now() - MAX_AGE_MS)) return null;
  return { userId: row.userId, payload: row.payload as unknown as PendingPayload };
}

export async function updatePendingPayload(
  id: string,
  patch: Partial<BuchenPayload>,
): Promise<PendingPayload | null> {
  const current = await getPendingAction(id);
  if (!current) return null;
  const next = { ...current.payload, ...patch };
  await prisma.discordPendingAction.update({
    where: { id },
    data: { payload: next as unknown as object },
  });
  return next;
}

export async function deletePendingAction(id: string): Promise<void> {
  await prisma.discordPendingAction.deleteMany({ where: { id } });
}
