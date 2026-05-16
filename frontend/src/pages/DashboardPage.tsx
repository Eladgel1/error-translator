import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listAnalyses } from "../api/client";
import type { PersistedAnalysis } from "../features/analyses/types";
import { clearAuthStorage } from "../features/auth/authStorage";

export function DashboardPage() {
  const navigate = useNavigate();

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

  function handleLogout() {
    clearAuthStorage();
    navigate("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Your saved error analyses.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-400"
            >
              Analyzer
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">
            Loading analyses...
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

        {!isLoading && !errorMessage && analyses.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">
            No saved analyses yet.
          </div>
        )}

        <div className="grid gap-4">
          {analyses.map((analysis) => (
            <Link
              key={analysis.id}
              to={`/analyses/${analysis.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-indigo-400"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-100">
                    {analysis.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {analysis.summary}
                  </p>
                </div>

                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  {analysis.language_detected}
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {new Date(analysis.created_at).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}