import { z } from "zod";

export const gameSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
});

export type GameInput = z.infer<typeof gameSchema>;
