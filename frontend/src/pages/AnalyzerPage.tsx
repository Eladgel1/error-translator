import { useState } from "react";
import type { AIResponse, ApiError, LanguageHint } from "../types/ai";
import { analyzeError } from "../api/client";

type FormState = {
  errorText: string;
  context: string;
  languageHint: LanguageHint;
};

export function AnalyzerPage() {
  const [form, setForm] = useState<FormState>({
    errorText: "",
    context: "",
    languageHint: "auto",   
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 flex items-center justify-center">
      <div className="max-w-6xl w-full px-4 py-8">
        <h1 className="text-3xl font-semibold mb-2 text-center">
          Error Translator
        </h1>
        <p className="text-slate-300 mb-8 text-center">
          Paste an error, add optional context, and get a structured explanation with fix steps.
        </p>

        {/* Content will be split into form + result sections */}
        <div className="grid gap-6 md:grid-cols-2">

          <div className="space-y-4">
            {/* Form placeholder */}
            <form
              className="space-y-4 bg-slate-900/60 border border-slate-700 rounded-xl p-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!form.errorText.trim() || isSubmitting) {
                  return;
                }

                setIsSubmitting(true);
                setApiError(null);
                setResult(null);

                const payload = {
                  error_text: form.errorText,
                  context: form.context.trim() ? form.context : undefined,
                  language_hint: form.languageHint === "auto" ? undefined : form.languageHint,
                };

                const response = await analyzeError(payload);

                if (response.ok) {
                  setResult(response.data);
                } else {
                  setApiError(response.error);
                }

                setIsSubmitting(false);
              }}
            >
              <div>
                <label
                  htmlFor="errorText"
                  className="block text-sm font-medium text-slate-200 mb-1"
                >
                  Error message
                </label>
                <textarea
                  id="errorText"
                  rows={6}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Paste the full error message or stack trace here..."
                  value={form.errorText}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      errorText: event.target.value,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-slate-400">
                  Required. The more complete the error, the better the analysis.
                </p>
              </div>

              <div>
                <label
                  htmlFor="context"
                  className="block text-sm font-medium text-slate-200 mb-1"
                >
                  Context (optional)
                </label>
                <textarea
                  id="context"
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Optional code snippet, what you were trying to do, environment details, etc."
                  value={form.context}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      context: event.target.value,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-slate-400">
                  Optional, but helps the model give more precise suggestions.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label
                    htmlFor="languageHint"
                    className="block text-sm font-medium text-slate-200 mb-1"
                  >
                    Language
                  </label>
                  <select
                    id="languageHint"
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={form.languageHint}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        languageHint: event.target.value as LanguageHint,
                      }))
                    }
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>

                <div className="flex gap-2 sm:justify-end mt-2 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => {
                      setForm({
                        errorText: "",
                        context: "",
                        languageHint: "auto",
                      });
                      setResult(null);
                      setApiError(null);
                    }}
                    disabled={isSubmitting && !form.errorText.trim()}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!form.errorText.trim() || isSubmitting}
                  >
                    {isSubmitting ? "Analyzing..." : "Analyze"}
                  </button>
                </div>
              </div>

              {apiError && (
                <div className="mt-3 rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                  <p className="font-medium">Request failed</p>
                  <p className="mt-1">
                    {apiError.message || "An unexpected error occurred."}
                  </p>
                  {apiError.code && (
                    <p className="mt-1 text-[11px] text-red-300">
                      Code: <span className="font-mono">{apiError.code}</span>
                    </p>
                  )}
                  {apiError.requestId && (
                    <p className="mt-1 text-[11px] text-red-300">
                      Request ID:{" "}
                      <span className="font-mono">{apiError.requestId}</span>
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="space-y-4">
            {/* Result placeholder */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 h-full flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-50">
                    Analysis result
                  </h2>
                  <p className="text-xs text-slate-400">
                    Summary, root cause, fix steps, and debugging guidance.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!result}
                    onClick={async () => {
                      if (!result) {
                        return;
                      }

                      const lines: string[] = [];

                      lines.push(`# Summary`);
                      lines.push(result.summary);
                      lines.push("");

                      lines.push(`# Likely cause`);
                      lines.push(result.likely_cause);
                      lines.push("");

                      if (result.fix_steps.length) {
                        lines.push(`# Fix steps`);
                        result.fix_steps.forEach((step, index) => {
                          lines.push(`${index + 1}. ${step}`);
                        });
                        lines.push("");
                      }

                      if (result.debug_steps.length) {
                        lines.push(`# Debug steps`);
                        result.debug_steps.forEach((step, index) => {
                          lines.push(`${index + 1}. ${step}`);
                        });
                        lines.push("");
                      }

                      if (result.assumptions.length) {
                        lines.push(`# Assumptions`);
                        result.assumptions.forEach((item) => {
                          lines.push(`- ${item}`);
                        });
                        lines.push("");
                      }

                      if (result.followup_questions.length) {
                        lines.push(`# Follow-up questions`);
                        result.followup_questions.forEach((q) => {
                          lines.push(`- ${q}`);
                        });
                        lines.push("");
                      }

                      lines.push(
                        `Detected language: ${result.language_detected}`,
                      );
                      lines.push(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);

                      const text = lines.join("\n");

                      try {
                        await navigator.clipboard.writeText(text);
                      } catch {
                        // Silently ignore clipboard errors
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {!result && !isSubmitting && !apiError && (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                  <p>
                    No analysis yet. Paste an error on the left and click{" "}
                    <span className="font-medium text-slate-200">Analyze</span>.
                  </p>
                </div>
              )}

              {isSubmitting && (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-300">
                  <p>Analyzing error, please wait…</p>
                </div>
              )}

              {result && !isSubmitting && (
                <div className="flex-1 space-y-4 overflow-auto">
                  <div className="grid gap-3 md:grid-cols-2">
                    <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                      <h3 className="text-sm font-semibold text-slate-50 mb-1.5">
                        Summary
                      </h3>
                      <p className="text-sm text-slate-200">{result.summary}</p>
                    </section>

                    <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                      <h3 className="text-sm font-semibold text-slate-50 mb-1.5">
                        Likely cause
                      </h3>
                      <p className="text-sm text-slate-200">
                        {result.likely_cause}
                      </p>
                    </section>
                  </div>

                  <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-50 mb-1.5">
                      Fix steps
                    </h3>
                    {result.fix_steps.length ? (
                      <ol className="list-decimal list-inside space-y-1 text-sm text-slate-200">
                        {result.fix_steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No specific fix steps provided.
                      </p>
                    )}
                  </section>

                  <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-50 mb-1.5">
                      Debug steps
                    </h3>
                    {result.debug_steps.length ? (
                      <ol className="list-decimal list-inside space-y-1 text-sm text-slate-200">
                        {result.debug_steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No additional debug guidance was provided.
                      </p>
                    )}
                  </section>

                  <div className="grid gap-3 md:grid-cols-2">
                    <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                      <h3 className="text-sm font-semibold text-slate-50 mb-1.5">
                        Assumptions
                      </h3>
                      {result.assumptions.length ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
                          {result.assumptions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">
                          No explicit assumptions were listed.
                        </p>
                      )}
                    </section>

                    <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                      <h3 className="text-sm font-semibold text-slate-50 mb-1.5">
                        Follow-up questions
                      </h3>
                      {result.followup_questions.length ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
                          {result.followup_questions.map((q, index) => (
                            <li key={index}>{q}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">
                          No follow-up questions suggested.
                        </p>
                      )}
                    </section>
                  </div>

                  <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 flex items-center justify-between text-xs text-slate-300">
                    <div>
                      <p>
                        Detected language:{" "}
                        <span className="font-mono text-slate-100">
                          {result.language_detected}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p>
                        Confidence:{" "}
                        <span className="font-mono text-slate-100">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </p>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}