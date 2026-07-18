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
    },
    changeEmail: {
      enabled: true,
      // No email-sending flow exists in this app and every user is
      // unverified anyway (no verification emails are ever sent), so
      // require the confirmation step only for accounts that actually
      // went through verification — i.e. none of them.
      updateEmailWithoutVerification: true,
    },
  },
  plugins: [
    admin(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
