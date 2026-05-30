import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAnalyses } from "../api/client";
import type { PersistedAnalysis } from "../features/analyses/types";
import { formatLocalDateTime } from "../utils/date";

export function DashboardPage() {
  const [analyses, setAnalyses] = useState<PersistedAnalysis[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalyses() {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await listAnalyses();

      setIsLoading(false);

      if (!result.ok) {
        setErrorMessage(result.error.message);
        return;
      }

      setAnalyses(result.data);
    }

    void loadAnalyses();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.7)] backdrop-blur-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Persistent history
            </span>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Review saved analyses, reopen previous debugging sessions, and
              build a searchable history of solved errors.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/40 transition hover:brightness-110"
          >
            New analysis
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-lg shadow-slate-950/40">
          Loading analyses...
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

      {!isLoading && !errorMessage && analyses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center shadow-lg shadow-slate-950/40">
          <h2 className="text-lg font-semibold text-slate-100">
            No saved analyses yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Run an analysis while logged in and it will appear here
            automatically.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-indigo-400/50 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/15"
          >
            Go to analyzer
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {analyses.map((analysis) => (
          <Link
            key={analysis.id}
            to={`/analyses/${analysis.id}`}
            className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40 transition hover:border-indigo-400/70 hover:bg-slate-900/90 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="line-clamp-1 font-semibold text-slate-100 group-hover:text-indigo-100">
                  {analysis.title}
                </h2>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                  {analysis.summary}
                </p>
              </div>

              <span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs font-medium text-slate-300">
                {analysis.language_detected}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-500">
              <span>{formatLocalDateTime(analysis.created_at)}</span>

              {analysis.is_favorite && (
                <span className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-1 text-yellow-200">
                  Favorite
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
