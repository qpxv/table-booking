import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // No self-signup: accounts are only created by an admin via the
  // user management page (actions/users.ts -> auth.api.createUser).
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  session: {
    // Lets proxy.ts do optimistic role checks from the cookie, without a DB round-trip.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    // Defaults ("user" / ["admin"]) match our schema's plain-string role field directly.
    admin(),
    // Must be the last plugin per Better Auth, so Server Actions can set cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
