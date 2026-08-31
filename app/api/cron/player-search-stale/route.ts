import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { PLAYER_SEARCH_STALE_AFTER_DAYS } from "@/lib/queries/player-search";
import { sendPushToUsers } from "@/lib/push/web-push";

export const dynamic = "force-dynamic";

// Daily (see vercel.json). Nags each creator once when a still-open
// Spielersuche has gone 14 days without confirmation; `staleNotifiedAt`
// de-dupes and is reset to null by confirmPlayerSearchActive.
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - PLAYER_SEARCH_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const stale = await prisma.playerSearch.findMany({
    where: {
      confirmedActiveAt: { lt: cutoff },
      staleNotifiedAt: null,
      OR: [{ end: { gte: now } }, { end: null }],
    },
    select: { id: true, system: true, creatorId: true },
  });

  for (const search of stale) {
    await sendPushToUsers([search.creatorId], {
      ...MESSAGES.NOTIFICATIONS.playerSearchStale(search.system),
      url: ROUTES.SPIELERSUCHE,
      tag: `search-stale-${search.id}`,
    });
  }

  if (stale.length > 0) {
    await prisma.playerSearch.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { staleNotifiedAt: now },
    });
    revalidatePath(ROUTES.SPIELERSUCHE);
    revalidatePath(ROUTES.DASHBOARD);
  }

  return Response.json({ notified: stale.length });
}
