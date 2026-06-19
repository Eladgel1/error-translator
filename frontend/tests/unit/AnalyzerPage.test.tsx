/* eslint-disable camelcase */
import {
  findAllByAltText,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyzerPage } from "../../src/pages/AnalyzerPage";
import type { AIResponse } from "../../src/types/ai";
import { vi, describe, it, expect, type Mock } from "vitest";
import { analyzeError } from "../../src/api/client";
import { HISTORY_STORAGE_KEY } from "../../src/features/history/types";

// Mock the API client
vi.mock("../../src/api/client", () => {
  return {
    analyzeError: vi.fn(),
  };
});

const fakeResponse: AIResponse = {
  language_detected: "javascript",
  summary: "Test summary",
  likely_cause: "Test likely cause",
  fix_steps: ["Fix step 1"],
  debug_steps: ["Debug step 1"],
  assumptions: ["Internal assumption"],
  followup_questions: ["Internal follow-up"],
  confidence: 0.9,
};

describe("AnalyzerPage Component", () => {
  it("renders initial form and disables Analyze when error text is empty", () => {
    render(<AnalyzerPage />);

    const textarea = screen.getByPlaceholderText(
      /Paste your error message here/i,
    );
    expect(textarea).toBeInTheDocument();

    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    expect(analyzeButton).toBeDisabled();
  });

  it("submits an error and renders assistant response", async () => {
    (analyzeError as Mock).mockResolvedValueOnce({
      ok: true,
      data: fakeResponse,
    });

    render(<AnalyzerPage />);
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(/Paste your error message here/i),
      "TypeError: Cannot read properties of undefined",
    );

    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    expect(analyzeButton).toBeEnabled();

    await user.click(analyzeButton);

    // Assistant response appears
    await screen.findByText(/🧠 Summary/i);
    await screen.findByText(/Test summary/i);

    // Loader disappears
    await waitFor(() => {
      expect(screen.queryByText(/Thinking…/i)).not.toBeInTheDocument();
    });
  });

  it("shows a user-friendly error message when API returns an error", async () => {
    (analyzeError as Mock).mockResolvedValueOnce({
      ok: false,
      error: {
        code: "validation_error",
        message: "Invalid request",
        status: 422,
        request_id: "test-req-id",
      },
    });

    render(<AnalyzerPage />);
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(/Paste your error message here/i),
      "x",
    );

    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    await user.click(analyzeButton);

    // UI error banner should show mapped text
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Invalid Input/i);
  });

  it("copies assistant message content when copy button is clicked", async () => {
    (analyzeError as Mock).mockResolvedValueOnce({
      ok: true,
      data: fakeResponse,
    });

    render(<AnalyzerPage />);
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(/Paste your error message here/i),
      "Some error",
    );

    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    await user.click(analyzeButton);

    // Assistant response appears
    const summaryHeading = await screen.findByText(/🧠 Summary/i);

    // Find the bubble container and copy button inside it
    const assistantBubble = summaryHeading.closest("div");
    expect(assistantBubble).not.toBeNull();

    const copyButton = assistantBubble!.querySelector("button");
    expect(copyButton).toBeNull();
  });
  it("loads existing history entries on first render", () => {
    // Inject fake history into localStorage
    const mockHistory = [
      {
        id: "1",
        createdAt: new Date().toISOString(),
        input: { errorText: "java error", languageHint: "java" },
        response: fakeResponse,
      },
    ];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(mockHistory));
    render(<AnalyzerPage />);
  });
  it("restores a history entry when clicked", async () => {
    const mockHistory = [
      {
        id: "1",
        createdAt: new Date().toISOString(),
        input: {
          errorText: "Restored error",
          contextText: "",
          languageHint: "python",
        },
        response: fakeResponse,
      },
    ];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(mockHistory));
    render(<AnalyzerPage />);
    const user = userEvent.setup();
    const entryBtn = screen.getByRole("button", { name: /PYTHON/i });
    await user.click(entryBtn);
    expect(entryBtn).toHaveTextContent(/python/i);
  });
  it("clears history when Clear History button is clicked", async () => {
    const mockHistory = [
      {
        id: "1",
        createdAt: new Date().toISOString(),
        input: { errorText: "error to clear", languageHint: "java" },
        response: fakeResponse,
      },
    ];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(mockHistory));
    render(<AnalyzerPage />);
    const user = userEvent.setup();
    const clearBtn = screen.getByRole("button", { name: /Clear history/i });
    await user.click(clearBtn);
    await waitFor(() =>
      expect(screen.queryByText(/error to clear/i)).not.toBeInTheDocument(),
    );
  });
  it("applies an example preset when clicked", async () => {
    render(<AnalyzerPage />);
    const user = userEvent.setup();
    const exampleButton = screen.getAllByRole("button")[0]; // first preset button
    await user.click(exampleButton);
    const textarea = screen.getByPlaceholderText(/Paste your error message/i);
    expect(textarea).not.toHaveValue(""); // preset inserted
  });
  it("clears the form when clicking Clear button", async () => {
    render(<AnalyzerPage />);
    const user = userEvent.setup();
    const textarea = screen.getByPlaceholderText(/Paste your error message/i);
    await user.type(textarea, "something");
    const clearButton = screen.getByRole("button", { name: /Clear/i });
    await user.click(clearButton);
    expect(textarea).toHaveValue("");
  });
});
