import { defineConfig } from "vitest/config";

// Standalone test config — the engine/RLE tests are pure Node, no Solid/jsdom transform needed.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
