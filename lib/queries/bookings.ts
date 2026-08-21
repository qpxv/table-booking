import "server-only";
import { unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/session";
import { MESSAGES } from "@/lib/constants";
import { fetchBookingsForTable, fetchUpcomingBookingsForUser } from "./bookings-helpers";

export async function listBookingsForTable(tableId: string): Promise<{
  success: boolean;
  bookings: Awaited<ReturnType<typeof fetchBookingsForTable>>;
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, bookings: [], message: MESSAGES.COMMON.NOT_AUTHENTICATED };

    const bookings = await fetchBookingsForTable(tableId);
    return { success: true, bookings };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listBookingsForTable", err);
    return { success: false, bookings: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function listUpcomingBookingsForUser(): Promise<{
  success: boolean;
  bookings: Awaited<ReturnType<typeof fetchUpcomingBookingsForUser>>;
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, bookings: [], message: MESSAGES.COMMON.NOT_AUTHENTICATED };

    const bookings = await fetchUpcomingBookingsForUser(session.user.id);
    return { success: true, bookings };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listUpcomingBookingsForUser", err);
    return { success: false, bookings: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
