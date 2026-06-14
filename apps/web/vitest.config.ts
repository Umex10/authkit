import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vitest config for fast, browser-free unit/component tests (jsdom).
 * Only picks up files under __tests__/unit; the Playwright e2e folder is
 * excluded so the two suites never collide.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/unit/setup.ts"],
    include: ["__tests__/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["__tests__/e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
