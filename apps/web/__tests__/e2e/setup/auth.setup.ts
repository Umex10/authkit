/**
 * Pre-authenticates the Playwright browser by provisioning a dedicated account
 * and persisting its storage state (the refresh-token cookie) to disk. The
 * `features` project then reuses that state so its specs start signed in.
 */
import { test as setup, expect } from "@playwright/test";
import { getTestData } from "../utils/getTestData";

const authFile = (browserName: string) =>
  `playwright/.auth/${browserName}.json`;

setup("authenticate", async ({ page, baseURL, browserName }) => {
  const { name, email, phone, password } = getTestData(browserName, "unique");

  await page.goto(`${baseURL}/sign-up`);
  await expect(page).toHaveURL(`${baseURL}/sign-up`);

  await page.getByTestId("sign-up-name-input").fill(name);
  await page.getByTestId("sign-up-email-input").fill(email);
  await page.getByTestId("sign-up-phone-input").fill(phone);
  await page.getByTestId("sign-up-password-input").fill(password);

  await page.getByTestId("sign-up-terms-checkbox").check();
  await page.getByTestId("sign-up-submit-button").click();

  await expect(page.locator(".toast-success")).toBeVisible({ timeout: 10_000 });

  // Persist cookies so the `features` project starts authenticated.
  await page.context().storageState({ path: authFile(browserName) });
});
