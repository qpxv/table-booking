import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export type SignInInput = z.infer<typeof signInSchema>;
