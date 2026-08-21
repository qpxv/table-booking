import "server-only";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { isAdmin, isHiddenAccount } from "@/lib/permissions";
import { MESSAGES } from "@/lib/constants";
import type { MemberOption } from "@/lib/user-types";

/** Plain, non-admin-gated member roster for the booking dialog's Mitglieder picker. */
export async function listMembers(): Promise<{
  success: boolean;
  members: MemberOption[];
  message?: string;
}> {
  try {
    const users = await prisma.user.findMany({
      where: { banned: { not: true } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      members: users.filter((user) => !isHiddenAccount(user.email)).map(({ id, name }) => ({ id, name })),
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listMembers", err);
    return { success: false, members: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

type ListedUsers = Awaited<ReturnType<typeof auth.api.listUsers>>["users"];

export async function listUsers(): Promise<{
  success: boolean;
  users: ListedUsers;
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      return { success: false, users: [], message: MESSAGES.COMMON.UNAUTHORIZED };
    }

    const result = await auth.api.listUsers({
      query: { sortBy: "name", sortDirection: "asc", limit: 200 },
      headers: await headers(),
    });

    return { success: true, users: result.users.filter((user) => !isHiddenAccount(user.email)) };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listUsers", err);
    return { success: false, users: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
