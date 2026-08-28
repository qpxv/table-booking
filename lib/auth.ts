import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      memberId: {
        type: "string",
        required: false,
        input: true,
      },
      iban: {
        type: "string",
        required: false,
        input: true,
      },
      // Server-managed only (input: false): admins can't set it through the
      // client and members can't clear it by editing their profile. It's
      // written directly via Prisma when an account is provisioned or its
      // password reset, and cleared by the forced-change server action.
      mustChangePassword: {
        type: "boolean",
        required: false,
        input: false,
      },
    },
    changeEmail: {
      enabled: true,
      // No email-sending flow exists in this app and every user is
      // unverified anyway (no verification emails are ever sent), so
      // require the confirmation step only for accounts that actually
      // went through verification, i.e. none of them.
      updateEmailWithoutVerification: true,
    },
  },
  plugins: [
    admin(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
