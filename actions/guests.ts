"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type GuestWithVisits = {
  id: string;
  name: string;
  visitCount: number;
  hasVisitedBefore: boolean;
};

export async function listGuestsForUser(): Promise<GuestWithVisits[]> {
  const session = await getSession();
  if (!session) throw new Error("Nicht angemeldet.");

  const guests = await prisma.guest.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { bookings: true } } },
    orderBy: { name: "asc" },
  });

  return guests.map((guest) => ({
    id: guest.id,
    name: guest.name,
    visitCount: guest._count.bookings,
    hasVisitedBefore: guest._count.bookings > 0,
  }));
}

const nameSchema = z.string().trim().min(1, "Name ist erforderlich");

/** Finds an existing guest of the user by name, or creates a new one. */
export async function findOrCreateGuest(name: string) {
  const session = await getSession();
  if (!session) throw new Error("Nicht angemeldet.");

  const parsedName = nameSchema.parse(name);

  const existing = await prisma.guest.findFirst({
    where: { userId: session.user.id, name: parsedName },
  });
  if (existing) return existing;

  return prisma.guest.create({
    data: { name: parsedName, userId: session.user.id },
  });
}
