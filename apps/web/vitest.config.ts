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
    // Console output plus a JUnit XML file with every test (name, duration,
    // error message of failed ones), locally and on CI. On GitHub Actions
    // failed tests are also marked on the run page. Listing reporters
    // replaces the default one, so "default" is named as well.
    reporters: [
      "default",
      "junit",
      ...(process.env.GITHUB_ACTIONS ? ["github-actions"] : []),
    ],
    outputFile: { junit: "test-reports/junit.xml" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
