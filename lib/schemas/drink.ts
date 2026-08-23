import { z } from "zod";

export const drinkBudgetSchema = z.object({
  initialCount: z.coerce.number().int().min(0),
});

export type DrinkBudgetInput = z.infer<typeof drinkBudgetSchema>;
