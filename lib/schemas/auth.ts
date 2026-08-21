import { z } from "zod";
import { MESSAGES } from "@/lib/constants";

export const signInSchema = z.object({
  email: z.email(MESSAGES.VALIDATION.EMAIL_INVALID),
  password: z.string().min(1, MESSAGES.VALIDATION.PASSWORD_REQUIRED),
});

export type SignInInput = z.infer<typeof signInSchema>;
