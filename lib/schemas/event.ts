import { z } from "zod";
import { MESSAGES } from "@/lib/constants";

const titleField = z.string().trim().min(1, MESSAGES.VALIDATION.TITLE_REQUIRED);
const descriptionField = z.string().trim().max(2000).optional();
const locationField = z.string().trim().max(200).optional();

const endAfterStart = (data: { start: Date; end?: Date }): boolean =>
  data.end === undefined || data.start < data.end;

// RHF form shape: start/end are real Dates from DateTimeField. `end` is
// omitted entirely when the "Endzeit festlegen" switch is off.
export const eventFieldsSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    location: locationField,
    start: z.date(),
    end: z.date().optional(),
  })
  .refine(endAfterStart, {
    message: MESSAGES.VALIDATION.START_BEFORE_END,
    path: ["end"],
  });

export type EventFieldsInput = z.infer<typeof eventFieldsSchema>;

// What the server actions accept (start/end coerced from wire strings).
export const eventInputSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    location: locationField,
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
  })
  .refine(endAfterStart, {
    message: MESSAGES.VALIDATION.START_BEFORE_END,
    path: ["end"],
  });

export type EventInput = z.input<typeof eventInputSchema>;
