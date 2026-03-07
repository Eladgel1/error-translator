import { test, expect } from "@playwright/test";

const ERROR_EXAMPLE =
    "TypeError: Cannot read properties of undefined";

test.describe("Analyzer Page E2E", () => {
  test.setTimeout(30_000);

  test.beforeEach(async ({ page }) => {
    // Make sure we start clean on each test
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

    // Initially disables where text is empty
    await expect(analyzeButton).toBeDisabled();

    // Fill both fields
    await errorTextarea.fill(ERROR_EXAMPLE);
    await contextTextarea.fill("line 42 in myHandler");

    await expect(analyzeButton).toBeEnabled();

    // Trigger analysis
    await analyzeButton.click();

    // While loading, button text changes to "Analyzing..."
    await expect(
      page.getByRole("button", { name: /Analyzing/i })
    ).toBeVisible();

    // Eventually we should see the summary heading rendered by ReactMarkdown
    const summaryHeading = page.getByRole("heading", {
      name: /🧠 Summary/i,
    });
    await expect(summaryHeading).toBeVisible();

    // Once we have a successful analysis, history should contain entries
    const clearHistoryButton = page.getByRole("button", {
      name: /Clear History/i,
    });
    await expect(clearHistoryButton).toBeVisible();
  });

  test("example preset fills form and enables Analyze", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    await expect(errorTextarea).toHaveValue("");
    await expect(analyzeButton).toBeDisabled();

    // Click one of the example presets from EXAMPLE_PRESETS
    await page
      .getByRole("button", { name: "JavaScript TypeError" })
      .click();
    
    // After applying preset, error textarea should not be empty
    await expect(errorTextarea).not.toHaveValue("");

    // Analyze should now be enabled
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

    // Fill fields and make sure Analyze is enabled
    await errorTextarea.fill("some error to clear");
    await contextTextarea.fill("some context to clear");
    await expect(analyzeButton).toBeEnabled();

    // Click Clear -> should reset everything
    await clearButton.click();

    await expect(errorTextarea).toHaveValue("");
    await expect(contextTextarea).toHaveValue("");
    await expect(analyzeButton).toBeDisabled();

    // Original message should not be visible in chat after clear
    await expect(
      page.getByText("some error to clear")
    ).not.toBeVisible();
  });

  test("history entry restores form and chat", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    // First run: create a history entry
    await errorTextarea.fill(ERROR_EXAMPLE);
    await analyzeButton.click();

    const summaryHeading = page.getByRole("heading", {
      name: /Summary/i,
    });
    await expect(summaryHeading).toBeVisible();

    // At this point there should be at least one history entry button
    // whose accessible name includes the error snippet (TypeError...)
    const historyPanel = page.getByRole("heading", { name: "History" }).locator("..").locator("..");
    const historyEntry = historyPanel.getByRole("button").last();

    // Clicking it should call restoreFromHistory(...)
    await historyEntry.click();

    // Form should be restored with the same error text
    await expect(errorTextarea).toHaveValue(ERROR_EXAMPLE);

    // And the assistant response (with Summary heading) should be visible
    await expect(
      page.getByRole("heading", { name: /Summary/i })
    ).toBeVisible();
  });

  test("clear history removes entries and shows empty state", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    // Create at least one history entry
    await errorTextarea.fill("History test error");
    await analyzeButton.click();

    const clearHistoryButton = page.getByRole("button", {
      name: /Clear history/i,
    });
    await expect(clearHistoryButton).toBeVisible();

    // Clear history
    await clearHistoryButton.click();

    // Empty-state message from AnalyzerPage
    await expect(
      page.getByText(/No previous analyses yet\./i)
    ).toBeVisible();
  });

  test("assistant copy button toggles icon to 'check' after click", async ({ page }) => {
    const errorTextarea = page.getByPlaceholder(
      "Paste your error message here..."
    );
    const analyzeButton = page.getByRole("button", { name: "Analyze" });

    await errorTextarea.fill("Copy test error");
    await analyzeButton.click();

    // Wait for assistant message (Summary)
    const summaryHeading = page.getByRole("heading", {
      name: /Summary/i,
    });
    await expect(summaryHeading).toBeVisible();

    // Copy button lives inside the assistant bubble and initially has lucide-copy icon
    const copyButton = page.locator("button").filter({ has: page.locator("svg") }).first();
    await copyButton.click();

    await expect(copyButton.locator("svg")).toHaveCount(1);
    await expect(copyButton).toBeVisible();
  });
});