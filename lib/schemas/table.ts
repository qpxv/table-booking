import { z } from "zod";
import { MESSAGES } from "@/lib/constants";

// Server-side shape. autoBookingPriority arrives as the raw string from the
// form's number input; "" / null / undefined all mean "no priority".
export const tableSchema = z.object({
  name: z.string().trim().min(1, MESSAGES.VALIDATION.NAME_REQUIRED),
  autoBookingPriority: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
    z.number().int().positive().nullable(),
  ),
});

export type TableInput = z.infer<typeof tableSchema>;

// RHF form shape: the priority field is a plain string bound to a number
// input; tableSchema above normalizes it on submit.
export const tableFormSchema = z.object({
  name: z.string().trim().min(1, MESSAGES.VALIDATION.NAME_REQUIRED),
  autoBookingPriority: z
    .string()
    .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) > 0), {
      message: MESSAGES.VALIDATION.PRIORITY_INVALID,
    }),
});

export type TableFormInput = z.infer<typeof tableFormSchema>;
