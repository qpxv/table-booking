import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma 7: the schema file itself no longer carries `url`/`directUrl`.
  // Migrate/CLI commands need a direct (non-pooled) connection to Neon —
  // the pooled DATABASE_URL is used by the app at runtime via the adapter in lib/prisma.ts.
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
