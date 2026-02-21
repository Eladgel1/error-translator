/* eslint-disable camelcase */
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { AIResponse, ApiError, LanguageHint } from "../types/ai";
import { analyzeError } from "../api/client";
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
Confidence: **${(r.confidence * 100).toFixed(1)}%**`
  );

  return parts.join("\n");
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
    message:
      "An unexpected error occurred. Please try again in a moment.",
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

    setChat((prev) => [
      ...prev,
      { role: "user", content: parts.join("\n\n") },
    ]);
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

    const result = await analyzeError(payload);

    if (!result.ok) {
      setApiError(result.error);
      setUiError(mapApiErrorToUiError(result.error));
      setIsLoading(false);
      return;
    }

    const formatted = formatAIResponseText(result.data);
    pushAssistantMessage(formatted);

    const newEntry: HistoryEntry = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      input: {
        errorText: form.errorText,
        contextText: form.context || undefined,
        languageHint: form.languageHint,
      },
      response: result.data,
    };

    const updated = appendHistoryEntry(newEntry);
    setHistory(updated);

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
    <div className="min-h-screen bg-slate-800 text-slate-100 flex items-center justify-center">
      <div className="max-w-5xl w-full px-4 py-10 space-y-8">

        {/* Header */}

        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Error Translator</h1>
          <p className="text-slate-300">
            Your personal AI assistant for debugging, summarizing, and fixing errors.
          </p>
        </header>

        {/* Try Example Buttons */}

        <div className="flex flex-wrap gap-2 bg-slate-900/70 p-4 rounded-xl border border-slate-700 shadow">
          {EXAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyExamplePreset(preset)}
              className="text-xs rounded border border-slate-600 px-2 py-1 hover:bg-slate-800 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Chat Window */}

        <div className="bg-slate-900/70 rounded-2xl p-6 h-[60vh] overflow-y-auto space-y-4 border border-slate-700 shadow-xl">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`relative max-w-[80%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed shadow-md transition-all
                  ${
            msg.role === "user"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-100 border border-slate-700"
            }
                `}
              >
                <div className="prose prose-invert text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-200 transition"
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
              <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm flex items-center gap-3 text-slate-300 shadow-md">
                <Loader2 className="h-5 w-5 animate-spin" />
                Thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* UI Error Banner */}

        {uiError && (
          <div className="rounded-lg border border-red-500 bg-red-900/40 p-3 text-sm text-red-200 shadow">
            <p className="font-semibold">{uiError.title}</p>
            <p className="text-xs mt-1">{uiError.message}</p>
          </div>
        )}

        {/* History Panel */}

        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-700 shadow space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1 text-sm font-semibold text-slate-200">
              <History className="h-4 w-4"/>
              History
            </h2>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-200 transition"
              >
                <Trash2 className="h-3 w-3" />
                Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400">
              No previous analyses yet.
            </p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto text-xs">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => restoreFromHistory(entry)}
                    className="w-full text-left rounded border border-slate-700 px-3 py-2 hover:bg-slate-800 transition"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-200">
                        {entry.response.language_detected.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="line-clamp-1 text-slate-300 mt-1">
                      {entry.input.errorText}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Form */}

        <form
          onSubmit={handleAnalyzeSubmit}
          className="space-y-4 bg-slate-900/70 rounded-2xl p-6 border border-slate-700 shadow-xl"
        >
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            placeholder="Paste your error message here..."
            value={form.errorText}
            onChange={(e) => {
              if (uiError?.type === "validation") clearErrors();
              setForm((p) => ({ ...p, errorText: e.target.value }));
            }}
          />

          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            placeholder="Optional context... (e.g your code section)"
            value={form.context}
            onChange={(e) =>
              setForm((p) => ({ ...p, context: e.target.value }))
            }
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <select
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>

              <button
                type="submit"
                disabled={isLoading || !form.errorText.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition"
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
      </div>
    </div>
  );
}
