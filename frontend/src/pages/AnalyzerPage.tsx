/* eslint-disable camelcase */
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { AIResponse, ApiError, LanguageHint } from "../types/ai";
import { analyzeError, analyzePersisted } from "../api/client";
import { getAccessToken } from "../features/auth/authStorage";
import type { HistoryEntry } from "../features/history/types";
import {
  Loader2,
  Copy as CopyIcon,
  Check,
  PencilLine,
  Trash2,
  History,
} from "lucide-react";

import {
  EXAMPLE_PRESETS,
  type ExamplePreset,
} from "../features/examples/examplePresets";

import {
  loadHistory,
  appendHistoryEntry,
  clearHistory as clearHistoryStorage,
} from "../features/history/storage";

/* -------------------- Types -------------------- */

type FormState = {
  errorText: string;
  context: string;
  languageHint: LanguageHint;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CopyState = "idle" | "copied";

type UiErrorType =
  | "validation"
  | "timeout"
  | "server_unavailable"
  | "configuration"
  | "network"
  | "unknown";

interface UiError {
  type: UiErrorType;
  title: string;
  message: string;
}

/* -------------------- Format AI Response -------------------- */

function formatAIResponseText(r: AIResponse): string {
  const parts: string[] = [];

  parts.push(`## 🧠 Summary\n${r.summary}\n`);
  parts.push(`## 🔍 Likely Cause\n${r.likely_cause}\n`);

  if (r.fix_steps.length) {
    parts.push("## 🛠 Fix Steps");
    r.fix_steps.forEach((s, i) => parts.push(`${i + 1}. ${s}`));
    parts.push("");
  }

  if (r.debug_steps.length) {
    parts.push("## 🧪 Debug Steps");
    r.debug_steps.forEach((s, i) => parts.push(`${i + 1}. ${s}`));
    parts.push("");
  }

  parts.push(
    `---\nDetected Language: **${r.language_detected}**  
Confidence: **${(r.confidence * 100).toFixed(1)}%**`,
  );

  return parts.join("\n");
}

function toAIResponse(response: {
  language_detected: AIResponse["language_detected"] | string;
  summary: string;
  likely_cause: string;
  fix_steps: string[];
  debug_steps: string[];
  assumptions: string[];
  followup_questions: string[];
  confidence: number;
}): AIResponse {
  return {
    language_detected:
      response.language_detected as AIResponse["language_detected"],
    summary: response.summary,
    likely_cause: response.likely_cause,
    fix_steps: response.fix_steps,
    debug_steps: response.debug_steps,
    assumptions: response.assumptions,
    followup_questions: response.followup_questions,
    confidence: response.confidence,
  };
}

function mapApiErrorToUiError(error: ApiError): UiError {
  const code = error.code ?? "unknown";
  const status = error.status;

  if (code === "validation_error" || status === 422) {
    return {
      type: "validation",
      title: "Invalid Input",
      message:
        "The request sent to the server is not valid. Make sure you pasted a complete error message and filled all required fields.",
    };
  }

  if (
    code === "http_error" &&
    error.message?.includes("Failed to reach AI provider")
  ) {
    return {
      type: "timeout",
      title: "AI Provider Unreachable",
      message:
        "There was a problem reaching the AI provider. Please try again later or check your internet connection.",
    };
  }

  if (code === "http_error" || (status && [502, 503, 504].includes(status))) {
    return {
      type: "server_unavailable",
      title: "Server Error",
      message:
        "The server or the AI provider encountered an issue. If this keeps happening, please contact support.",
    };
  }

  if (code === "ai_client_error") {
    return {
      type: "configuration",
      title: "Configuration Issue",
      message:
        "The AI service is not properly configured on the server. Please contact the administrator.",
    };
  }

  if (status === 0) {
    return {
      type: "network",
      title: "Network Error",
      message:
        "We couldn't connect to the server. Please check your internet connection and try again.",
    };
  }

  return {
    type: "unknown",
    title: "Unexpected Error",
    message: "An unexpected error occurred. Please try again in a moment.",
  };
}

export function AnalyzerPage() {
  const [form, setForm] = useState<FormState>({
    errorText: "",
    context: "",
    languageHint: "auto",
  });

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [uiError, setUiError] = useState<UiError | null>(null);

  const [copyState, setCopyState] = useState<CopyState>("idle");

  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  const isLoggedIn = Boolean(getAccessToken());
  const shouldShowLocalHistory = !isLoggedIn;

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isLoading]);

  function clearErrors() {
    setUiError(null);
    setApiError(null);
  }

  function pushUserMessage() {
    const parts: string[] = [];
    parts.push(form.errorText.trim());

    if (form.context.trim()) {
      parts.push("\n**Context:**\n" + form.context.trim());
    }

    setChat((prev) => [...prev, { role: "user", content: parts.join("\n\n") }]);
  }

  function pushAssistantMessage(text: string) {
    setChat((prev) => [...prev, { role: "assistant", content: text }]);
  }

  function restoreFromHistory(entry: HistoryEntry) {
    clearErrors();

    setForm({
      errorText: entry.input.errorText,
      context: entry.input.contextText ?? "",
      languageHint: entry.input.languageHint,
    });

    const restoredAssistant = formatAIResponseText(entry.response);

    setChat([
      { role: "user", content: entry.input.errorText },
      { role: "assistant", content: restoredAssistant },
    ]);
  }

  function handleClearHistory() {
    clearHistoryStorage();
    setHistory([]);
  }

  function applyExamplePreset(preset: ExamplePreset) {
    clearErrors();

    setForm({
      errorText: preset.errorText,
      context: preset.contextText ?? "",
      languageHint: preset.languageHint,
    });
  }

  async function handleAnalyzeSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.errorText.trim()) return;

    clearErrors();
    setIsLoading(true);

    pushUserMessage();

    const payload = {
      error_text: form.errorText,
      context: form.context.trim() ? form.context : undefined,
      language_hint:
        form.languageHint === "auto" ? undefined : form.languageHint,
    };

    const result = isLoggedIn
      ? await analyzePersisted(payload)
      : await analyzeError(payload);

    if (!result.ok) {
      setApiError(result.error);
      setUiError(mapApiErrorToUiError(result.error));
      setIsLoading(false);
      return;
    }

    const aiResponse = toAIResponse(result.data);

    const formatted = formatAIResponseText(aiResponse);
    pushAssistantMessage(formatted);

    const newEntry: HistoryEntry = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      input: {
        errorText: form.errorText,
        contextText: form.context || undefined,
        languageHint: form.languageHint,
      },
      response: aiResponse,
    };

    if (shouldShowLocalHistory) {
      const updated = appendHistoryEntry(newEntry);
      setHistory(updated);
    }

    setUiError(null);
    setIsLoading(false);
  }

  async function handleCopy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 4000);
    } catch {
      console.log("An unexpected error occurred...");
    }
  }

  function handleClear() {
    setChat([]);
    clearErrors();
    setCopyState("idle");
    setForm({
      errorText: "",
      context: "",
      languageHint: "auto",
    });
  }

  return (
    <section className="flex w-full flex-col gap-8 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-2xl sm:p-8 lg:p-10">
      {/* Page intro */}
      <header className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
              AI debugging workspace
            </span>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
              Analyze and translate errors
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[0.9rem]">
              Paste an error message, add optional context, and get a structured
              explanation and debugging guidance.
            </p>
          </div>

          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 shadow-sm">
            {isLoggedIn ? "Saved to DB" : "Guest Mode"}
          </span>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/70 to-transparent" />
      </header>

      {/* Quick presets */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Quick presets
          </h2>
          <p className="text-[11px] text-slate-500">
            Start with a sample error to see how the assistant responds.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyExamplePreset(preset)}
              className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs text-slate-100 shadow-sm shadow-slate-950/40 transition hover:border-indigo-400/80 hover:bg-slate-900 hover:text-indigo-100"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {/* Conversation */}
      <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg shadow-slate-950/40 lg:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Conversation</h2>
          {apiError && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200">
              {uiError?.title ?? "Something went wrong"}
            </span>
          )}
        </div>

        <div className="min-h-[320px] space-y-4 overflow-y-auto rounded-xl bg-slate-950/60 p-4">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`relative max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md shadow-slate-950/60 transition-all ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                    : "border border-slate-700/80 bg-slate-900/90 text-slate-100"
                }`}
              >
                <div className="prose prose-invert text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {msg.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.content)}
                    className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-slate-950/70 p-1.5 text-slate-400 ring-1 ring-slate-700/70 transition hover:text-slate-100 hover:ring-indigo-400/70"
                  >
                    {copyState === "copied" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-300 shadow-md shadow-slate-950/60">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </section>

      {/* Error banner */}
      {uiError && (
        <div
          className="rounded-2xl border border-red-500/60 bg-red-950/60 p-3 text-sm text-red-100 shadow-lg shadow-red-900/60"
          role="alert"
        >
          <p className="font-semibold">{uiError.title}</p>
          <p className="mt-1 text-xs text-red-100/90">{uiError.message}</p>
        </div>
      )}

      {/* History */}
      {shouldShowLocalHistory && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-100">
              <History className="h-4 w-4 text-slate-300" />
              History
            </h2>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition hover:bg-slate-800 hover:text-emerald-200"
              >
                <Trash2 className="h-3 w-3" />
                Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400">No previous analyses yet.</p>
          ) : (
            <ul className="mt-1 max-h-56 space-y-1 overflow-y-auto text-xs">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => restoreFromHistory(entry)}
                    className="group w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-left transition hover:border-indigo-500/70 hover:bg-slate-900/90"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-200 group-hover:text-indigo-200">
                        {entry.response.language_detected.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-1 text-[11px] text-slate-300 group-hover:text-slate-100">
                      {entry.input.errorText}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Form */}
      <form
        onSubmit={handleAnalyzeSubmit}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg shadow-slate-950/50 sm:p-6"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Error message
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Paste your error message here..."
              value={form.errorText}
              onChange={(e) => {
                if (uiError?.type === "validation") clearErrors();
                setForm((p) => ({ ...p, errorText: e.target.value }));
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Optional context
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Optional context... (e.g your code section)"
              value={form.context}
              onChange={(e) =>
                setForm((p) => ({ ...p, context: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-4 sm:flex-row">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="text-xs font-medium text-slate-300">
              Language hint
            </label>
            <select
              className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              value={form.languageHint}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  languageHint: e.target.value as LanguageHint,
                }))
              }
            >
              <option value="auto">Auto-detect</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm shadow-slate-950/60 transition hover:border-red-400/70 hover:bg-red-950/40 hover:text-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>

            <button
              type="submit"
              disabled={isLoading || !form.errorText.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <PencilLine className="h-4 w-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
