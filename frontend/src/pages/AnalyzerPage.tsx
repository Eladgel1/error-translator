import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { AIResponse, ApiError, LanguageHint } from "../types/ai";
import { analyzeError } from "../api/client";
import {
  Loader2,
  Copy as CopyIcon,
  Check,
  PencilLine,
  Trash2,
} from "lucide-react";

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

/* ===================== MAIN COMPONENT ===================== */

export function AnalyzerPage() {
  const [form, setForm] = useState<FormState>({
    errorText: "",
    context: "",
    languageHint: "auto",
  });

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isLoading]);

  /* -------------------- Push Messages -------------------- */

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

  /* -------------------- Analyze -------------------- */

  async function handleAnalyzeSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.errorText.trim()) return;

    setIsLoading(true);
    setApiError(null);

    pushUserMessage();

    const payload = {
      error_text: form.errorText,
      context: form.context.trim() ? form.context : undefined,
      language_hint:
        form.languageHint === "auto" ? undefined : form.languageHint,
    };

    const response = await analyzeError(payload);

    if (response.ok) {
      const formatted = formatAIResponseText(response.data);
      pushAssistantMessage(formatted);
    } else {
      setApiError(response.error);
    }

    setIsLoading(false);
  }

  /* -------------------- Copy Button Logic -------------------- */

  async function handleCopy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 4000);
    } catch {}
  }

  /* -------------------- Clear -------------------- */

  function handleClear() {
    setChat([]);
    setApiError(null);
    setCopyState("idle");
    setForm({
      errorText: "",
      context: "",
      languageHint: "auto",
    });
  }

  /* ===================== RENDER ===================== */

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 flex items-center justify-center">
      <div className="max-w-4xl w-full px-4 py-10 space-y-8">

        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Error Translator</h1>
          <p className="text-slate-300">
            Your personal AI assistant for debugging, summarizing, and fixing errors.
          </p>
        </header>

        <div className="bg-slate-900/70 rounded-2xl p-6 h-[70vh] overflow-y-auto space-y-4 border border-slate-700 shadow-xl">
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

        {apiError && (
          <div className="rounded-lg border border-red-500 bg-red-950/50 p-3 text-sm text-red-200">
            <p className="font-semibold">Request failed</p>
            <p className="text-xs mt-1">{apiError.message}</p>
          </div>
        )}

        <form
          onSubmit={handleAnalyzeSubmit}
          className="space-y-4 bg-slate-900/70 rounded-2xl p-6 border border-slate-700 shadow-xl"
        >
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            placeholder="Paste your error message here..."
            value={form.errorText}
            onChange={(e) =>
              setForm((p) => ({ ...p, errorText: e.target.value }))
            }
          />

          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
            placeholder="Optional context..."
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
