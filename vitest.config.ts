import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The friend group lives in Pacific time; pin it so DST tests are deterministic everywhere.
process.env.TZ = "America/Los_Angeles";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});
