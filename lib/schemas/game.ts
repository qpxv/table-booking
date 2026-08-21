import { z } from "zod";
import { MESSAGES } from "@/lib/constants";

export const gameSchema = z.object({
  name: z.string().trim().min(1, MESSAGES.VALIDATION.NAME_REQUIRED),
});

export type GameInput = z.infer<typeof gameSchema>;
