import { z } from "zod";
import { MESSAGES } from "@/lib/constants";
import { MATCH_TYPE_VALUES } from "@/lib/player-search-types";

const systemField = z.string().trim().min(1, MESSAGES.VALIDATION.SYSTEM_REQUIRED);
const matchTypeField = z.enum(MATCH_TYPE_VALUES, {
  message: MESSAGES.VALIDATION.MATCH_TYPE_REQUIRED,
});

// RHF form shape: start/end are real Dates from DateTimeField, mirroring
// bookingFieldsSchema. Client-side validation only.
export const playerSearchFieldsSchema = z
  .object({
    start: z.date(),
    end: z.date(),
    system: systemField,
    matchType: matchTypeField,
  })
  .refine((data) => data.start < data.end, {
    message: MESSAGES.VALIDATION.START_BEFORE_END,
    path: ["end"],
  })
  .refine((data) => data.start > new Date(), {
    message: MESSAGES.VALIDATION.START_IN_FUTURE,
    path: ["start"],
  });

export type PlayerSearchFieldsInput = z.infer<typeof playerSearchFieldsSchema>;

// What the server action accepts: start/end coerced from the strings the
// client sends over the wire.
export const createPlayerSearchSchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    system: systemField,
    matchType: matchTypeField,
  })
  .refine((data) => data.start < data.end, {
    message: MESSAGES.VALIDATION.START_BEFORE_END,
    path: ["end"],
  })
  .refine((data) => data.start > new Date(), {
    message: MESSAGES.VALIDATION.START_IN_FUTURE,
    path: ["start"],
  });

export type CreatePlayerSearchInput = z.input<typeof createPlayerSearchSchema>;

export const respondPlayerSearchSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export type RespondPlayerSearchInput = z.infer<typeof respondPlayerSearchSchema>;
