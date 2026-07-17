import { z } from "zod";

export const tableSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  active: z.boolean(),
});

export type TableInput = z.infer<typeof tableSchema>;
