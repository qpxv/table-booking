import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/enums";

async function fetchBookingsForTable(tableId: string) {
  return prisma.booking.findMany({
    where: { tableId, status: BookingStatus.ACTIVE },
    include: {
      user: { select: { name: true } },
      guests: { include: { guest: { select: { name: true } } } },
      participants: { include: { user: { select: { name: true } } } },
    },
    orderBy: { start: "asc" },
  });
}

export async function listBookingsForTable(tableId: string): Promise<{
  success: boolean;
  bookings: Awaited<ReturnType<typeof fetchBookingsForTable>>;
  message?: string;
}> {
  try {
    const bookings = await fetchBookingsForTable(tableId);
    return { success: true, bookings };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listBookingsForTable", err);
    return { success: false, bookings: [], message: "Ein Fehler ist aufgetreten." };
  }
}
