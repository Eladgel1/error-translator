/* eslint-disable */
import { test, expect } from "@playwright/test";

const ERROR_EXAMPLE = "TypeError: Cannot read properties of undefined";

const mockAnalysisResponse = {
  language_detected: "javascript",
  summary: "Mocked summary for E2E test.",
  likely_cause: "The code is trying to access a property on an undefined value.",
  fix_steps: [
    "Check that the object exists before reading from it.",
    "Add a guard clause or optional chaining.",
  ],
  debug_steps: [
    "Log the object before accessing the property.",
    "Trace where the value should be initialized.",
  ],
  assumptions: ["This is a mocked Playwright response."],
  followup_questions: ["Can you share the code that creates the object?"],
  confidence: 0.9,
};

test.describe("Analyzer Page E2E", () => {
  test.setTimeout(30_000);

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockAnalysisResponse),
      });
    });

    await page.route("**/api/followup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockAnalysisResponse,
          summary: "Mocked follow-up summary for E2E test.",
        }),
      });
    });

    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("smoke: paste error -> analyze -> summary & history", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const contextTextarea = page.getByPlaceholder(
      "Optional context... (e.g your code section)"
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    await expect(analyzeButton).toBeDisabled();

    await errorTextarea.fill(ERROR_EXAMPLE);
    await contextTextarea.fill("line 42 in myHandler");

    await expect(analyzeButton).toBeEnabled();

    await analyzeButton.click();

    await expect(
      page.getByRole("heading", { name: /Summary/i })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Clear History/i })
    ).toBeVisible();
  });

  test("example preset fills form and enables Analyze", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    await expect(errorTextarea).toHaveValue("");
    await expect(analyzeButton).toBeDisabled();

    await page.getByRole("button", { name: "JavaScript TypeError" }).click();

    await expect(errorTextarea).not.toHaveValue("");
    await expect(analyzeButton).toBeEnabled();
  });

  test("clear button resets form and chat", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const contextTextarea = page.getByPlaceholder(
      "Optional context... (e.g your code section)"
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });
    const clearButton = page.getByRole("button", { name: "Clear" });

    await errorTextarea.fill("some error to clear");
    await contextTextarea.fill("some context to clear");
    await expect(analyzeButton).toBeEnabled();

    await clearButton.click();

    await expect(errorTextarea).toHaveValue("");
    await expect(contextTextarea).toHaveValue("");
    await expect(analyzeButton).toBeDisabled();

    await expect(page.getByText("some error to clear")).not.toBeVisible();
  });

  test("history entry restores form and chat", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    await errorTextarea.fill(ERROR_EXAMPLE);
    await analyzeButton.click();

    await expect(
      page.getByRole("heading", { name: /Summary/i })
    ).toBeVisible();

    const historyPanel = page
      .getByRole("heading", { name: "History" })
      .locator("..")
      .locator("..");

    const historyEntry = historyPanel.getByRole("button").last();

    await historyEntry.click();

    await expect(errorTextarea).toHaveValue(ERROR_EXAMPLE);

    await expect(
      page.getByRole("heading", { name: /Summary/i })
    ).toBeVisible();
  });

  test("clear history removes entries and shows empty state", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    await errorTextarea.fill("History test error");
    await analyzeButton.click();

    const clearHistoryButton = page.getByRole("button", {
      name: /Clear history/i,
    });

    await expect(clearHistoryButton).toBeVisible();

    await clearHistoryButton.click();

    await expect(
      page.getByText(/No previous analyses yet\./i)
    ).toBeVisible();
  });

  test("assistant copy button is clickable", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    await errorTextarea.fill("Copy test error");
    await analyzeButton.click();

    await expect(
      page.getByRole("heading", { name: /Summary/i })
    ).toBeVisible();

    const copyButton = page
      .locator("button")
      .filter({ has: page.locator("svg") })
      .first();

    await copyButton.click();

    await expect(copyButton.locator("svg")).toHaveCount(1);
    await expect(copyButton).toBeVisible();
  });
});