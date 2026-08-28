"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requireAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { eventInputSchema, type EventInput } from "@/lib/schemas/event";
import type { ServiceResult } from "@/lib/service-types";

function revalidateEvents(): void {
  revalidatePath(ROUTES.EVENTS);
  revalidatePath(ROUTES.DASHBOARD);
}

export async function createEvent(values: EventInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const parsed = eventInputSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await prisma.event.create({
      data: {
        createdById: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        location: parsed.data.location || null,
        start: parsed.data.start,
        end: parsed.data.end ?? null,
      },
    });

    // notification-potential: announce the new event to all members.
    revalidateEvents();
    return { success: true, message: MESSAGES.EVENT.CREATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createEvent", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function updateEvent(id: string, values: EventInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = eventInputSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return { success: false, message: MESSAGES.EVENT.NOT_FOUND };

  try {
    // notification-potential: if start/end changed, notify every participant
    // that the event moved.
    await prisma.event.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        location: parsed.data.location || null,
        start: parsed.data.start,
        end: parsed.data.end ?? null,
      },
    });

    revalidateEvents();
    return { success: true, message: MESSAGES.EVENT.UPDATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateEvent", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function deleteEvent(id: string): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return { success: false, message: MESSAGES.EVENT.NOT_FOUND };

  try {
    // notification-potential: notify every participant that the event was
    // cancelled (capture the participant list before this delete).
    await prisma.event.delete({ where: { id } });

    revalidateEvents();
    return { success: true, message: MESSAGES.EVENT.DELETED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteEvent", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function joinEvent(eventId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { success: false, message: MESSAGES.EVENT.NOT_FOUND };

  try {
    // notification-potential: tell the event's creator that <session.user>
    // signed up.
    await prisma.eventParticipant.upsert({
      where: { eventId_userId: { eventId, userId: session.user.id } },
      create: { eventId, userId: session.user.id },
      update: {},
    });

    revalidateEvents();
    return { success: true, message: MESSAGES.EVENT.JOINED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in joinEvent", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function leaveEvent(eventId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  try {
    await prisma.eventParticipant.deleteMany({
      where: { eventId, userId: session.user.id },
    });

    revalidateEvents();
    return { success: true, message: MESSAGES.EVENT.LEFT };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in leaveEvent", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
