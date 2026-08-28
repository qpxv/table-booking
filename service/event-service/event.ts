"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requireAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { eventInputSchema, type EventInput } from "@/lib/schemas/event";
import { formatEventDateRange } from "@/lib/datetime";
import { notify } from "@/lib/push/notify";
import type { ServiceResult } from "@/lib/service-types";

async function otherMemberIds(exceptUserId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { id: { not: exceptUserId } },
    select: { id: true },
  });
  return users.map((user) => user.id);
}

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
    const created = await prisma.event.create({
      data: {
        createdById: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        location: parsed.data.location || null,
        start: parsed.data.start,
        end: parsed.data.end ?? null,
      },
    });

    notify(
      await otherMemberIds(session.user.id),
      MESSAGES.NOTIFICATIONS.eventCreated(
        created.title,
        formatEventDateRange(created.start, created.end),
        created.location,
      ),
      ROUTES.EVENTS,
      `event-${created.id}`,
    );
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

  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const parsed = eventInputSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  const event = await prisma.event.findUnique({
    where: { id },
    include: { participants: { select: { userId: true } } },
  });
  if (!event) return { success: false, message: MESSAGES.EVENT.NOT_FOUND };

  const newEnd = parsed.data.end ?? null;
  const moved =
    event.start.getTime() !== parsed.data.start.getTime() ||
    (event.end?.getTime() ?? null) !== (newEnd?.getTime() ?? null);

  try {
    await prisma.event.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        location: parsed.data.location || null,
        start: parsed.data.start,
        end: newEnd,
      },
    });

    if (moved) {
      notify(
        event.participants
          .map((participant) => participant.userId)
          .filter((userId) => userId !== session.user.id),
        MESSAGES.NOTIFICATIONS.eventMoved(
          parsed.data.title,
          formatEventDateRange(parsed.data.start, newEnd),
        ),
        ROUTES.EVENTS,
        `event-${id}`,
      );
    }
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

  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const event = await prisma.event.findUnique({
    where: { id },
    include: { participants: { select: { userId: true } } },
  });
  if (!event) return { success: false, message: MESSAGES.EVENT.NOT_FOUND };

  // Captured before the delete cascades the participant rows away.
  const participantIds = event.participants.map((participant) => participant.userId);

  try {
    await prisma.event.delete({ where: { id } });

    notify(
      participantIds.filter((userId) => userId !== session.user.id),
      MESSAGES.NOTIFICATIONS.eventCancelled(
        event.title,
        formatEventDateRange(event.start, event.end),
      ),
      ROUTES.EVENTS,
      `event-${id}`,
    );
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
    const existing = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId: session.user.id } },
      select: { id: true },
    });
    if (!existing) {
      await prisma.eventParticipant.create({
        data: { eventId, userId: session.user.id },
      });

      if (event.createdById !== session.user.id) {
        notify(
          [event.createdById],
          MESSAGES.NOTIFICATIONS.eventJoined(session.user.name, event.title),
          ROUTES.EVENTS,
          `event-${eventId}`,
        );
      }
    }
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
