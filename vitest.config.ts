import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Standalone test config: the app's Vite config loads the TanStack Start /
 * router plugins, which are not needed (and not safe) for node unit tests of
 * the verification service.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
