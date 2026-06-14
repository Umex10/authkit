import { test, expect } from "@playwright/test";
import { getTestData } from "./utils/getTestData";

/**
 * These specs run with the storage state from auth.setup.ts, i.e. the browser
 * is already signed in as the bootstrap user. Each test signs that user out
 * first, then exercises a specific flow.
 */
test.describe("Auth flows (already signed-in bootstrap user)", () => {
  test("authenticated user is redirected away from /sign-up, then sign-in works", async ({
    page,
    baseURL,
    browserName,
  }) => {
    // Signed in -> visiting /sign-up bounces to the dashboard (proxy.ts).
    await page.goto(`${baseURL}/sign-up`);
    await expect(page).toHaveURL(`${baseURL}/dashboard`, { timeout: 10_000 });

    // Sign out -> back to the landing page.
    await page.getByTestId("header-sign-out-button").click();
    await expect(page).toHaveURL(`${baseURL}/`);

    // Try to register the very same account again -> duplicate error.
    await page.getByTestId("landing-get-started-link").click();
    await expect(page).toHaveURL(`${baseURL}/sign-up`);

    const { name, email, phone, password } = getTestData(browserName, "unique");
    await page.getByTestId("sign-up-name-input").fill(name);
    await page.getByTestId("sign-up-email-input").fill(email);
    await page.getByTestId("sign-up-phone-input").fill(phone);
    await page.getByTestId("sign-up-password-input").fill(password);
    await page.getByTestId("sign-up-terms-checkbox").check();
    await page.getByTestId("sign-up-submit-button").click();

    await expect(page.locator(".toast-error")).toBeVisible({ timeout: 10_000 });

    // Switch to sign-in and authenticate with the existing account.
    await page.getByTestId("sign-up-sign-in-link").click();
    await expect(page).toHaveURL(`${baseURL}/sign-in`);

    await page.getByTestId("sign-in-email-input").fill(email);
    await page.getByTestId("sign-in-password-input").fill(password);
    await page.getByTestId("sign-in-submit-button").click();

    await expect(page.locator(".toast-success")).toBeVisible({ timeout: 10_000 });
  });

  test("already signed in: opening the root URL bounces to the dashboard with a note", async ({
    page,
    baseURL,
  }) => {
    // The bootstrap user is signed in (refresh_tk cookie present). Hitting the
    // landing page should make proxy.ts redirect straight to the dashboard with
    // the ?redirected=1 flag, and the dashboard should explain why.
    await page.goto(`${baseURL}/`);
    await expect(page).toHaveURL(/\/dashboard\?redirected=1$/, {
      timeout: 10_000,
    });
    await expect(page.getByTestId("dashboard-redirect-note")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("sign-up shows per-field duplicate errors that clear on edit", async ({
    page,
    baseURL,
    browserName,
  }) => {
    await page.goto(`${baseURL}/sign-up`);
    await expect(page).toHaveURL(`${baseURL}/dashboard`, { timeout: 10_000 });

    await page.getByTestId("header-sign-out-button").click();
    await expect(page).toHaveURL(`${baseURL}/`);

    await page.getByTestId("landing-get-started-link").click();
    await expect(page).toHaveURL(`${baseURL}/sign-up`);

    const { name, email, phone, password } = getTestData(browserName, "unique");
    await page.getByTestId("sign-up-name-input").fill(name);
    await page.getByTestId("sign-up-email-input").fill(email);
    await page.getByTestId("sign-up-phone-input").fill(phone);
    await page.getByTestId("sign-up-password-input").fill(password);
    await page.getByTestId("sign-up-terms-checkbox").check();
    await page.getByTestId("sign-up-submit-button").click();

    await expect(page.locator(".toast-error")).toBeVisible({ timeout: 10_000 });

    // Backend field errors are replayed onto the inputs.
    await expect(page.getByTestId("sign-up-email-error")).toBeVisible();
    await expect(page.getByTestId("sign-up-phone-error")).toBeVisible();

    // Editing to unique values clears the errors and lets the sign-up succeed.
    await page.getByTestId("sign-up-email-input").fill("unique" + email);
    await page.getByTestId("sign-up-phone-input").fill(phone.slice(0, 13));

    await expect(page.getByTestId("sign-up-email-error")).not.toBeVisible();
    await expect(page.getByTestId("sign-up-phone-error")).not.toBeVisible();

    await page.getByTestId("sign-up-submit-button").click();
    await expect(page.locator(".toast-success")).toBeVisible({ timeout: 10_000 });
  });

  test("sign-in lands on the dashboard and loads the user via /me", async ({
    page,
    baseURL,
    browserName,
  }) => {
    await page.goto(`${baseURL}/sign-in`);
    await expect(page).toHaveURL(`${baseURL}/dashboard`, { timeout: 10_000 });

    await page.getByTestId("header-sign-out-button").click();
    await expect(page).toHaveURL(`${baseURL}/`);

    await page.getByTestId("landing-sign-in-link").click();
    await expect(page).toHaveURL(`${baseURL}/sign-in`);

    const { email, password } = getTestData(browserName, "unique");
    await page.getByTestId("sign-in-email-input").fill(email);
    await page.getByTestId("sign-in-password-input").fill(password);
    await page.getByTestId("sign-in-submit-button").click();

    await expect(page.locator(".toast-success")).toBeVisible({ timeout: 10_000 });

    // Full chain proof: redirected to the protected dashboard and GET /me
    // resolved the greeting.
    await expect(page).toHaveURL(`${baseURL}/dashboard`, { timeout: 10_000 });
    await expect(page.getByTestId("dashboard-welcome")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("wrong credentials fail without leaking which field was wrong", async ({
    page,
    baseURL,
    browserName,
  }) => {
    await page.goto(`${baseURL}/sign-in`);
    await expect(page).toHaveURL(`${baseURL}/dashboard`, { timeout: 10_000 });

    await page.getByTestId("header-sign-out-button").click();
    await expect(page).toHaveURL(`${baseURL}/`);

    await page.getByTestId("landing-sign-in-link").click();
    await expect(page).toHaveURL(`${baseURL}/sign-in`);

    const { email, password } = getTestData(browserName, "unique");
    await page.getByTestId("sign-in-email-input").fill("wrong" + email);
    await page.getByTestId("sign-in-password-input").fill("wrong" + password);
    await page.getByTestId("sign-in-submit-button").click();

    await expect(page.locator(".toast-error")).toBeVisible({ timeout: 10_000 });

    // Security: the backend must not reveal which field was wrong.
    await expect(page.getByTestId("sign-in-email-error")).not.toBeVisible();
    await expect(page.getByTestId("sign-in-password-error")).not.toBeVisible();

    // Correct credentials then succeed.
    await page.getByTestId("sign-in-email-input").fill(email);
    await page.getByTestId("sign-in-password-input").fill(password);
    await page.getByTestId("sign-in-submit-button").click();

    await expect(page.locator(".toast-success")).toBeVisible({ timeout: 10_000 });
  });
});
