import { z } from "zod";
import { MESSAGES } from "@/lib/constants";

export const tableSchema = z.object({
  name: z.string().trim().min(1, MESSAGES.VALIDATION.NAME_REQUIRED),
});

export type TableInput = z.infer<typeof tableSchema>;
