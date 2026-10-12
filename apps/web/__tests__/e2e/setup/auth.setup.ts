/**
 * Registers the bootstrap account and saves the browser's storage state (the
 * HTTP-only refresh cookie). The `features` project reuses that state, so its
 * signed-in specs skip the sign-up.
 */
import { test as setup } from "@playwright/test";
import { bootstrapAccount } from "../utils/accounts";
import { expectDashboardFor, openSignUp, submitSignUp } from "../utils/flows";

setup("register the bootstrap account", async ({ page }) => {
  await openSignUp(page);
  await submitSignUp(page, bootstrapAccount);

  await expectDashboardFor(page, bootstrapAccount);

  await page.context().storageState({ path: "playwright/.auth/chromium.json" });
});
