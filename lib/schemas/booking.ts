import { z } from "zod";

export const guestInputSchema = z.union([
  z.object({ guestId: z.string().min(1) }),
  z.object({ newName: z.string().trim().min(1) }),
]);

export type GuestInput = z.infer<typeof guestInputSchema>;

// The subset of booking fields actually driven by the RHF form in
// BookingDialog (guests are managed as separate local state, since they need
// to carry display info — visit count, "new vs. existing" — that the
// server-side schemas below don't care about). Shared by both the create and
// edit dialogs since start/end/game are identical in shape either way.
// start/end are real Dates here (set via the DateTimeField calendar+hour/
// minute picker), not native-input strings.
export const bookingFieldsSchema = z
  .object({
    start: z.date(),
    end: z.date(),
    game: z.string().trim().optional(),
  })
  .refine((data) => data.start < data.end, {
    message: "Start muss vor dem Ende liegen.",
    path: ["end"],
  });

export type BookingFieldsInput = z.infer<typeof bookingFieldsSchema>;

export const createBookingSchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    game: z.string().trim().optional(),
    guests: z.array(guestInputSchema).default([]),
    participantUserIds: z.array(z.string().min(1)).default([]),
  })
  .refine((data) => data.start < data.end, {
    message: "Start muss vor dem Ende liegen.",
    path: ["end"],
  });

// z.input (not z.infer/output) — start/end accept the raw string a native
// <input type="datetime-local"> produces; z.coerce.date() turns them into
// Date only once .parse() actually runs (client validation and, again,
// server-side inside the action).
export type CreateBookingInput = z.input<typeof createBookingSchema>;

export const updateBookingSchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    game: z.string().trim().optional(),
    // Optional (not defaulted): omitted entirely by reschedule calls
    // (drag/resize), which must not touch guest assignments. Only present
    // when the edit dialog explicitly submits a guest list.
    guests: z.array(guestInputSchema).optional(),
    // Same optional-not-defaulted deal as guests — omitted on reschedule so
    // participants added via Mitmachen aren't touched by a plain move/resize.
    participantUserIds: z.array(z.string().min(1)).optional(),
  })
  .refine((data) => data.start < data.end, {
    message: "Start muss vor dem Ende liegen.",
    path: ["end"],
  });

export type UpdateBookingInput = z.input<typeof updateBookingSchema>;
