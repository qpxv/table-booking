import { z } from "zod";

export const roleSchema = z.enum(["admin", "user"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  email: z.email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  role: roleSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  role: roleSchema,
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
