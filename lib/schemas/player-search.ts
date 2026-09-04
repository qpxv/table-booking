import { z } from "zod";
import { MESSAGES } from "@/lib/constants";

const systemField = z.string().trim().min(1, MESSAGES.VALIDATION.SYSTEM_REQUIRED);
const matchTypeField = z.string().trim().min(1, MESSAGES.VALIDATION.MATCH_TYPE_REQUIRED);
const noteField = z.string().trim().max(500).optional();
// Total players wanted, including the creator. 2 is a classic 1v1 search.
// Form field: RHF already hands us a number (valueAsNumber).
const playerCountField = z
  .number()
  .int(MESSAGES.VALIDATION.PLAYER_COUNT_RANGE)
  .min(2, MESSAGES.VALIDATION.PLAYER_COUNT_RANGE)
  .max(8, MESSAGES.VALIDATION.PLAYER_COUNT_RANGE);
// Wire field: the server action coerces defensively.
const playerCountWireField = z
  .coerce.number()
  .int(MESSAGES.VALIDATION.PLAYER_COUNT_RANGE)
  .min(2, MESSAGES.VALIDATION.PLAYER_COUNT_RANGE)
  .max(8, MESSAGES.VALIDATION.PLAYER_COUNT_RANGE);

const startBeforeEnd = { message: MESSAGES.VALIDATION.START_BEFORE_END, path: ["end"] };
const startInFuture = { message: MESSAGES.VALIDATION.START_IN_FUTURE, path: ["start"] };

// RHF form shape: start/end are real Dates from DateTimeField. The
// "Feste Uhrzeit" toggle is local component state, not a form field: when it
// is off the action drops start/end, so the form still always carries a
// (default) valid window.
export const playerSearchFieldsSchema = z
  .object({
    start: z.date(),
    end: z.date(),
    system: systemField,
    matchType: matchTypeField,
    playerCount: playerCountField,
  })
  .refine((data) => data.start < data.end, startBeforeEnd)
  .refine((data) => data.start > new Date(), startInFuture);

export type PlayerSearchFieldsInput = z.infer<typeof playerSearchFieldsSchema>;

// What the server action accepts. `fixedTime` false => start/end ignored and
// stored as null (flexible search).
const windowValid = (data: { start?: Date; end?: Date; fixedTime: boolean }): boolean =>
  !data.fixedTime ||
  (data.start !== undefined && data.end !== undefined && data.start < data.end);
const windowInFuture = (data: { start?: Date; fixedTime: boolean }): boolean =>
  !data.fixedTime || (data.start !== undefined && data.start > new Date());

export const createPlayerSearchSchema = z
  .object({
    fixedTime: z.boolean(),
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    system: systemField,
    matchType: matchTypeField,
    playerCount: playerCountWireField,
  })
  .refine(windowValid, startBeforeEnd)
  .refine(windowInFuture, startInFuture);

export type CreatePlayerSearchInput = z.input<typeof createPlayerSearchSchema>;

// Registering interest. The "Uhrzeit vorschlagen" toggle is local component
// state; the form always carries a default window. A proposed time is
// optional on the wire; the action makes it mandatory for a flexible search.
export const respondPlayerSearchFieldsSchema = z
  .object({
    proposedStart: z.date(),
    proposedEnd: z.date(),
    note: noteField,
  })
  .refine((data) => data.proposedStart < data.proposedEnd, {
    message: MESSAGES.VALIDATION.START_BEFORE_END,
    path: ["proposedEnd"],
  });

export type RespondPlayerSearchFieldsInput = z.infer<typeof respondPlayerSearchFieldsSchema>;

const proposedWindowValid = (data: { proposedStart?: Date; proposedEnd?: Date }): boolean => {
  const has = data.proposedStart !== undefined;
  if (has !== (data.proposedEnd !== undefined)) return false;
  return !has || (data.proposedStart as Date) < (data.proposedEnd as Date);
};

export const respondPlayerSearchSchema = z
  .object({
    note: noteField,
    proposedStart: z.coerce.date().optional(),
    proposedEnd: z.coerce.date().optional(),
  })
  .refine(proposedWindowValid, {
    message: MESSAGES.VALIDATION.START_BEFORE_END,
    path: ["proposedEnd"],
  });

export type RespondPlayerSearchInput = z.input<typeof respondPlayerSearchSchema>;

// A counter-proposal always carries a concrete future window.
export const counterPlayerSearchFieldsSchema = z
  .object({
    start: z.date(),
    end: z.date(),
    note: noteField,
  })
  .refine((data) => data.start < data.end, startBeforeEnd)
  .refine((data) => data.start > new Date(), startInFuture);

export type CounterPlayerSearchFieldsInput = z.infer<typeof counterPlayerSearchFieldsSchema>;

export const counterPlayerSearchSchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    note: noteField,
  })
  .refine((data) => data.start < data.end, startBeforeEnd)
  .refine((data) => data.start > new Date(), startInFuture);

export type CounterPlayerSearchInput = z.input<typeof counterPlayerSearchSchema>;
