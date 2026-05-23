import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/client";
import { saveAccessToken, saveAuthUser } from "../features/auth/authStorage";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await loginUser({
      email,
      password,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    saveAccessToken(result.data.access_token);
    saveAuthUser(result.data.user);

    navigate("/dashboard");
  }

  return (
    <section className="mx-auto max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.7)] backdrop-blur-2xl sm:p-8">
      <div className="mb-8">
        <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
          Welcome back
        </span>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-100">
          Login
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Sign in to access your saved debugging history and persistent analysis
          workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Email
          </span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Password
          </span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/60 bg-red-950/60 p-3 text-sm text-red-100 shadow-lg shadow-red-900/40"
          >
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        No account yet?{" "}
        <Link to="/register" className="text-indigo-300 hover:text-indigo-200">
          Create one
        </Link>
      </p>
    </section>
  );
}