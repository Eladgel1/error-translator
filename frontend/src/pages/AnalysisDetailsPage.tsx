import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteAnalysis, getAnalysis, toggleFavorite } from "../api/client";
import type { PersistedAnalysis } from "../features/analyses/types";
import { formatLocalDateTime } from "../utils/date";

export function AnalysisDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<PersistedAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalysis() {
      if (!id) {
        setErrorMessage("Missing analysis id.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const result = await getAnalysis(id);

      setIsLoading(false);

      if (!result.ok) {
        setErrorMessage(result.error.message);
        return;
      }

      setAnalysis(result.data);
    }

    void loadAnalysis();
  }, [id]);

  async function handleDelete() {
    if (!id) return;

    const result = await deleteAnalysis(id);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    navigate("/dashboard");
  }

  async function handleToggleFavorite() {
    if (!id) return;

    const result = await toggleFavorite(id);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setAnalysis(result.data);
  }

  return (
    <section className="space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
      >
        ← Back to dashboard
      </Link>

      {isLoading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-lg shadow-slate-950/40">
          Loading analysis...
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/60 bg-red-950/60 p-4 text-sm text-red-100 shadow-lg shadow-red-900/40"
        >
          {errorMessage}
        </div>
      )}

      {analysis && (
        <article className="space-y-6 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.7)] backdrop-blur-2xl sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
                {analysis.language_detected}
              </span>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
                {analysis.title}
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Created {formatLocalDateTime(analysis.created_at)} •{" "}
                {(analysis.confidence * 100).toFixed(1)}% confidence
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-100 transition hover:bg-yellow-500/15"
              >
                {analysis.is_favorite ? "Unfavorite" : "Favorite"}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
              >
                Delete
              </button>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Original Error
              </h2>
              <pre className="mt-3 max-h-80 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-950/80 p-4 text-sm leading-6 text-slate-200">
                {analysis.error_text}
              </pre>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <h2 className="text-sm font-semibold text-slate-100">Context</h2>
              <pre className="mt-3 max-h-80 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-950/80 p-4 text-sm leading-6 text-slate-200">
                {analysis.context || "No additional context provided."}
              </pre>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-sm font-semibold text-slate-100">Summary</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {analysis.summary}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-sm font-semibold text-slate-100">
              Likely Cause
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {analysis.likely_cause}
            </p>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="text-sm font-semibold text-slate-100">
                Fix Steps
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                {analysis.fix_steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="text-sm font-semibold text-slate-100">
                Debug Steps
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                {analysis.debug_steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>
          </div>
        </article>
      )}
    </section>
  );
}