import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env.local on its own.
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
