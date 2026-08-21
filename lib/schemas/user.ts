import { z } from "zod";
import { ROLES, MESSAGES } from "@/lib/constants";

export const roleSchema = z.enum([ROLES.ADMIN, ROLES.USER]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, MESSAGES.VALIDATION.NAME_REQUIRED),
  email: z.email(MESSAGES.VALIDATION.EMAIL_INVALID),
  password: z.string().min(8, MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH),
  memberId: z.string().trim().min(1, MESSAGES.VALIDATION.MEMBER_ID_REQUIRED),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, MESSAGES.VALIDATION.NAME_REQUIRED),
  email: z.email(MESSAGES.VALIDATION.EMAIL_INVALID),
  memberId: z.string().trim().min(1, MESSAGES.VALIDATION.MEMBER_ID_REQUIRED),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Form-only variant (adds a confirmation field validated client-side);
// distinct from resetPasswordSchema above, which is what the server action
// actually accepts.
export const resetPasswordFormSchema = z
  .object({
    newPassword: z.string().min(8, MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH),
    confirmPassword: z.string().min(1, MESSAGES.VALIDATION.PASSWORD_CONFIRM_REQUIRED),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: MESSAGES.VALIDATION.PASSWORDS_DO_NOT_MATCH,
    path: ["confirmPassword"],
  });

export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
