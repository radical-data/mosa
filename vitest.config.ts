import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["scripts/**/*.test.ts", "apps/*/src/**/*.test.ts", "packages/**/*.test.ts"],
  },
});
