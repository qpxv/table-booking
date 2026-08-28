import { z } from "zod";

// Mirrors the browser's PushSubscriptionJSON (what `subscription.toJSON()`
// returns). `expirationTime` is accepted but not stored: it's null in every
// browser that matters and the push service is the source of truth for
// liveness anyway (we prune on 404/410).
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
