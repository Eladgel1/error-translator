/* eslint-disable camelcase */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  confirmPasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode,
} from "../api/client";

type ResetStep = "email" | "code" | "password" | "success";

const RESEND_SECONDS = 60;

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<ResetStep>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [countdown, setCountdown] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setCountdown((currentValue) => currentValue - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [countdown]);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    const result = await requestPasswordReset({
      email,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setInfoMessage(
      "If this email is registered, a 6-digit verification code was sent to it.",
    );
    setCountdown(RESEND_SECONDS);
    setStep("code");
  }

  async function handleResendCode() {
    if (countdown > 0) {
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    const result = await requestPasswordReset({
      email,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setInfoMessage("A new verification code was sent to your email.");
    setCountdown(RESEND_SECONDS);
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    const result = await verifyPasswordResetCode({
      email,
      code,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setInfoMessage("Verification code confirmed. Choose a new password.");
    setStep("password");
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setInfoMessage(null);

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New password and confirmation password do not match.");
      return;
    }

    setIsSubmitting(true);

    const result = await confirmPasswordReset({
      email,
      code,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setInfoMessage("Password reset successfully. Redirecting to login...");
    setStep("success");

    window.setTimeout(() => {
      navigate("/login");
    }, 1200);
  }

  return (
    <section className="mx-auto max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.7)] backdrop-blur-2xl sm:p-8">
      <div className="mb-8">
        <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200">
          Account recovery
        </span>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-100">
          Reset password
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter your email, verify the 6-digit code, and choose a new password.
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending code..." : "Send verification code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Verification code
            </span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Confirm code"}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={isSubmitting || countdown > 0}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              New password
            </span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Confirm new password
            </span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              type="password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating password..." : "Set new password"}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/50 p-4 text-sm leading-6 text-emerald-100">
          Your password was reset successfully. You can now log in with your new
          password.
        </div>
      )}

      {infoMessage && (
        <div className="mt-4 rounded-2xl border border-sky-500/50 bg-sky-950/50 p-3 text-sm leading-6 text-sky-100">
          {infoMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-500/60 bg-red-950/60 p-3 text-sm text-red-100 shadow-lg shadow-red-900/40"
        >
          {errorMessage}
        </div>
      )}

      <p className="mt-6 text-sm text-slate-400">
        Remembered your password?{" "}
        <Link to="/login" className="text-indigo-300 hover:text-indigo-200">
          Back to login
        </Link>
      </p>
    </section>
  );
}
