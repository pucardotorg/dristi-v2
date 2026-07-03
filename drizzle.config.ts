import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config({ path: ".env.local" });
config();

export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
