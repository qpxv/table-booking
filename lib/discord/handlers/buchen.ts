import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { MESSAGES } from "@/lib/constants";
import { formatEventDateRange } from "@/lib/datetime";
import { createBooking } from "@/service/booking-service/booking";
import {
  ephemeralMessage,
  deferredComponentUpdate,
} from "../responses";
import { getStringOption } from "../options";
import { getActorForInteraction } from "../actor";
import { editInteractionResponse } from "../rest";
import { idFromCustomId } from "../ids";
import { parseGermanDateTime } from "../parse-datetime";
import { listBookableTablesForWindow } from "@/lib/queries/tables";
import {
  stringSelectRow,
  userSelectRow,
  buttonRow,
} from "../components";
import {
  sweepPendingActions,
  createPendingAction,
  getPendingAction,
  updatePendingPayload,
  deletePendingAction,
} from "../pending";
import type { DiscordInteraction, InteractionResponse } from "@/lib/discord-types";

export async function handleBuchen(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const resolution = await getActorForInteraction(interaction);
  if (!resolution.ok) return ephemeralMessage(resolution.error);

  await sweepPendingActions();

  const options = interaction.data?.options ?? [];
  const parsed = parseGermanDateTime(
    getStringOption(options, "datum") ?? "",
    getStringOption(options, "uhrzeit") ?? "",
    getStringOption(options, "dauer"),
  );
  if (!parsed.ok) return ephemeralMessage(MESSAGES.DISCORD.INVALID_DATETIME);

  const game = getStringOption(options, "spiel");
  const guestNames = (getStringOption(options, "gaeste") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const tables = await listBookableTablesForWindow(parsed.start, parsed.end);
  if (tables.length === 0) return ephemeralMessage(MESSAGES.DISCORD.NO_TABLES_FREE);

  const pendingId = await createPendingAction(resolution.actor.id, {
    kind: "buchen",
    startISO: parsed.start.toISOString(),
    endISO: parsed.end.toISOString(),
    game: game ?? null,
    guestNames,
    tableId: null,
    memberDiscordIds: [],
  });

  return ephemeralMessage(
    MESSAGES.DISCORD.buchenSummary(
      formatEventDateRange(parsed.start, parsed.end),
      game ?? null,
      guestNames,
    ),
    [
      stringSelectRow(
        `buchen_tisch:${pendingId}`,
        MESSAGES.DISCORD.SELECT_TABLE_PLACEHOLDER,
        tables.map((t) => ({
          label: t.shared ? `${t.name} (Mehrfachbuchung)` : t.name,
          value: t.id,
        })),
      ),
      userSelectRow(
        `buchen_member:${pendingId}`,
        MESSAGES.DISCORD.SELECT_MEMBERS_PLACEHOLDER,
        { minValues: 0, maxValues: 10 },
      ),
      buttonRow(`buchen_confirm:${pendingId}`, "Buchen"),
    ],
  );
}

export async function handleBuchenTableSelect(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const pendingId = idFromCustomId(interaction.data?.custom_id);
  await updatePendingPayload(pendingId, {
    tableId: interaction.data?.values?.[0] ?? null,
  });
  return deferredComponentUpdate();
}

export async function handleBuchenMemberSelect(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const pendingId = idFromCustomId(interaction.data?.custom_id);
  await updatePendingPayload(pendingId, {
    memberDiscordIds: interaction.data?.values ?? [],
  });
  return deferredComponentUpdate();
}

export async function handleBuchenConfirm(
  interaction: DiscordInteraction,
): Promise<InteractionResponse> {
  const pendingId = idFromCustomId(interaction.data?.custom_id);
  const token = interaction.token;

  after(async () => {
    try {
      const resolution = await getActorForInteraction(interaction);
      if (!resolution.ok) {
        await replace(token, resolution.error);
        return;
      }

      const pending = await getPendingAction(pendingId);
      if (!pending || pending.payload.kind !== "buchen") {
        await replace(token, MESSAGES.DISCORD.ACTION_EXPIRED);
        return;
      }
      const p = pending.payload;
      if (!p.tableId) {
        await replace(token, MESSAGES.DISCORD.PICK_A_TABLE);
        return;
      }

      let participantUserIds: string[] = [];
      let skippedNote = "";
      if (p.memberDiscordIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { discordUserId: { in: p.memberDiscordIds } },
          select: { id: true, discordUserId: true },
        });
        participantUserIds = users.map((u) => u.id);
        const linked = new Set(users.map((u) => u.discordUserId));
        const missing = p.memberDiscordIds.filter((id) => !linked.has(id));
        if (missing.length > 0) {
          skippedNote =
            "\n" + MESSAGES.DISCORD.skippedUnlinked(missing.map((id) => `<@${id}>`));
        }
      }

      const result = await createBooking(
        p.tableId,
        {
          start: new Date(p.startISO),
          end: new Date(p.endISO),
          game: p.game ?? undefined,
          guests: p.guestNames.map((newName) => ({ newName })),
          participantUserIds,
        },
        resolution.actor,
      );

      await deletePendingAction(pendingId);
      await replace(token, result.message + skippedNote);
    } catch (err) {
      console.error("discord buchen confirm failed", err);
      await replace(token, MESSAGES.DISCORD.GENERIC_ERROR);
    }
  });

  return deferredComponentUpdate();
}

async function replace(token: string, content: string): Promise<void> {
  await editInteractionResponse(token, { content, components: [] });
}
