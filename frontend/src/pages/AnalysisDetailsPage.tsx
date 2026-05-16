import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteAnalysis,
  getAnalysis,
  toggleFavorite,
} from "../api/client";
import type { PersistedAnalysis } from "../features/analyses/types";

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
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl space-y-6">
        <Link to="/dashboard" className="text-sm text-indigo-300">
          ← Back to dashboard
        </Link>

        {isLoading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">
            Loading analysis...
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {errorMessage}
          </div>
        )}

        {analysis && (
          <article className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">{analysis.title}</h1>
                <p className="mt-2 text-sm text-slate-400">
                  {analysis.language_detected} •{" "}
                  {(analysis.confidence * 100).toFixed(1)}% confidence
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm transition hover:border-yellow-400"
                >
                  {analysis.is_favorite ? "Unfavorite" : "Favorite"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </header>

            <section>
              <h2 className="text-lg font-semibold">Original Error</h2>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-200">
                {analysis.error_text}
              </pre>
            </section>

            {analysis.context && (
              <section>
                <h2 className="text-lg font-semibold">Context</h2>
                <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-200">
                  {analysis.context}
                </pre>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold">Summary</h2>
              <p className="mt-2 text-slate-300">{analysis.summary}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Likely Cause</h2>
              <p className="mt-2 text-slate-300">{analysis.likely_cause}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Fix Steps</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-300">
                {analysis.fix_steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Debug Steps</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-300">
                {analysis.debug_steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>
          </article>
        )}
      </section>
    </main>
  );
}